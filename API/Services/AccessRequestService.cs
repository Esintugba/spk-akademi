using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum AccessRequestError
{
    None,
    LicenseNotFound,
    AlreadyHasAccess,
    DuplicateRequest,
    InvalidStatusTransition,
    NotFound
}

public interface IAccessRequestService
{
    Task<(AccessRequestError Error, AccessRequestResponseDto? Result)> CreateAsync(
        string studentId,
        CreateAccessRequestDto dto,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AccessRequestResponseDto>> GetMyRequestsAsync(
        string studentId,
        CancellationToken cancellationToken = default);

    Task<AdminAccessRequestListDto> GetAdminQueueAsync(
        AccessRequestQueryDto query,
        CancellationToken cancellationToken = default);

    Task<(AccessRequestError Error, AdminAccessRequestDto? Result)> UpdateStatusAsync(
        Guid id,
        string adminUserId,
        UpdateAccessRequestStatusDto dto,
        CancellationToken cancellationToken = default);
}

public class AccessRequestService(
    DataContext context,
    IAccessRequestRepository requestRepository,
    IAccessApprovalService approvalService,
    IEmailNotificationService emailService,
    ILicenseAccessService licenseAccessService,
    UserManager<AppUser> userManager,
    ILogger<AccessRequestService> logger) : IAccessRequestService
{
    public async Task<(AccessRequestError Error, AccessRequestResponseDto? Result)> CreateAsync(
        string studentId,
        CreateAccessRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var plan = await context.Plans
            .AsNoTracking()
            .Include(x => x.PlanLicenses)
            .FirstOrDefaultAsync(x => x.Id == dto.PlanId, cancellationToken);

        if (plan is null || plan.PlanLicenses.Count == 0)
        {
            return (AccessRequestError.LicenseNotFound, null);
        }

        var planLicenseIds = plan.PlanLicenses.Select(x => x.LicenseId).ToList();
        var alreadyHasAllLicenses = true;
        foreach (var licenseId in planLicenseIds)
        {
            if (!await licenseAccessService.CanAccessLicense(studentId, licenseId))
            {
                alreadyHasAllLicenses = false;
                break;
            }
        }

        if (alreadyHasAllLicenses)
        {
            return (AccessRequestError.AlreadyHasAccess, null);
        }

        if (await requestRepository.HasBlockingRequestAsync(studentId, dto.PlanId, cancellationToken))
        {
            return (AccessRequestError.DuplicateRequest, null);
        }

        var request = new AccessRequest
        {
            StudentId = studentId,
            PlanId = dto.PlanId,
            Message = dto.Message?.Trim(),
            Status = AccessRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };

        requestRepository.Add(request);
        await requestRepository.SaveAsync(cancellationToken);

        logger.LogInformation(
            "Access request created. RequestId: {RequestId}, StudentId: {StudentId}, PlanId: {PlanId}",
            request.Id,
            request.StudentId,
            request.PlanId);

        request.Plan = plan;
        var student = await userManager.FindByIdAsync(studentId);

        if (student?.Email is not null)
        {
            var template = EmailTemplates.AccessRequestCreated(plan.Name);
            if (await SendStudentEmailIfEnabledAsync(student, template.Subject, template.Body, cancellationToken))
            {
                request.EmailSent = true;
                request.UpdatedAt = DateTime.UtcNow;
                await requestRepository.SaveAsync(cancellationToken);
            }
        }

        return (AccessRequestError.None, ToResponse(request, plan.Name));
    }

    public async Task<IReadOnlyList<AccessRequestResponseDto>> GetMyRequestsAsync(
        string studentId,
        CancellationToken cancellationToken = default)
    {
        var items = await requestRepository.GetByStudentAsync(studentId, cancellationToken);
        return items
            .Select(x => ToResponse(x, x.Plan?.Name ?? "Paket"))
            .ToList();
    }

    public async Task<AdminAccessRequestListDto> GetAdminQueueAsync(
        AccessRequestQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await requestRepository.QueryAdminAsync(query, cancellationToken);

        return new AdminAccessRequestListDto(
            items.Select(ToAdminDto).ToList(),
            total,
            Math.Max(1, query.Page),
            Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<(AccessRequestError Error, AdminAccessRequestDto? Result)> UpdateStatusAsync(
        Guid id,
        string adminUserId,
        UpdateAccessRequestStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.Status is AccessRequestStatus.Pending)
        {
            return (AccessRequestError.InvalidStatusTransition, null);
        }

        var request = await requestRepository.GetByIdAsync(id, cancellationToken);

        if (request is null)
        {
            return (AccessRequestError.NotFound, null);
        }

        if (request.Status is AccessRequestStatus.Approved or AccessRequestStatus.Rejected or AccessRequestStatus.Cancelled)
        {
            return (AccessRequestError.InvalidStatusTransition, null);
        }

        var now = DateTime.UtcNow;
        request.Status = dto.Status;
        request.AdminNote = dto.AdminNote?.Trim();
        request.ReviewedAt = now;
        request.ReviewedByUserId = adminUserId;
        request.UpdatedAt = now;

        if (dto.Status == AccessRequestStatus.Approved)
        {
            await approvalService.GrantPlanAccessAsync(request.StudentId, request.PlanId, cancellationToken);
            logger.LogInformation(
                "Access request approved and plan access granted. RequestId: {RequestId}, StudentId: {StudentId}, PlanId: {PlanId}, AdminUserId: {AdminUserId}",
                request.Id,
                request.StudentId,
                request.PlanId,
                adminUserId);
        }
        else
        {
            logger.LogInformation(
                "Access request status updated. RequestId: {RequestId}, StudentId: {StudentId}, PlanId: {PlanId}, Status: {Status}, AdminUserId: {AdminUserId}",
                request.Id,
                request.StudentId,
                request.PlanId,
                request.Status,
                adminUserId);
        }

        await requestRepository.SaveAsync(cancellationToken);

        var student = request.Student ?? await userManager.FindByIdAsync(request.StudentId);
        var planName = request.Plan?.Name ?? "Paket";

        if (student?.Email is not null)
        {
            var template = dto.Status switch
            {
                AccessRequestStatus.Approved => EmailTemplates.AccessRequestApproved(planName),
                AccessRequestStatus.Rejected => EmailTemplates.AccessRequestRejected(planName, request.AdminNote),
                _ => (Subject: string.Empty, Body: string.Empty)
            };

            if (!string.IsNullOrEmpty(template.Subject))
            {
                if (await SendStudentEmailIfEnabledAsync(student, template.Subject, template.Body, cancellationToken))
                {
                    request.EmailSent = true;
                    await requestRepository.SaveAsync(cancellationToken);
                }
            }
        }

        return (AccessRequestError.None, ToAdminDto(request));
    }

    private async Task<bool> SendStudentEmailIfEnabledAsync(
        AppUser student,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(student.Email))
        {
            return false;
        }

        var emailNotificationsEnabled = await context.UserSettings
            .AsNoTracking()
            .Where(x => x.UserId == student.Id)
            .Select(x => (bool?)x.EmailNotifications)
            .FirstOrDefaultAsync(cancellationToken) ?? true;

        if (!emailNotificationsEnabled)
        {
            return false;
        }

        await emailService.SendAsync(student.Email, subject, body, cancellationToken);
        return true;
    }

    private static AccessRequestResponseDto ToResponse(AccessRequest request, string planName) =>
        new(
            request.Id,
            request.PlanId,
            planName,
            request.Status,
            request.RequestedAt,
            request.Message,
            request.AdminNote,
            request.ReviewedAt,
            request.EmailSent);

    private static AdminAccessRequestDto ToAdminDto(AccessRequest request) =>
        new(
            request.Id,
            request.StudentId,
            request.Student?.Email ?? string.Empty,
            request.Student?.DisplayName,
            request.PlanId,
            request.Plan?.Name ?? "Paket",
            request.Status,
            request.Message,
            request.AdminNote,
            request.RequestedAt,
            request.ReviewedAt,
            request.ReviewedBy?.Email,
            request.EmailSent);
}
