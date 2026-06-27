using API.Configuration;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace API.Services;

public enum UserLicenseAccessManagementError
{
    None,
    Unauthorized,
    NotFound,
    UserNotFound,
    LicenseNotFound,
    DuplicateAccess,
    PaymentDisabled
}

public sealed class UserLicenseAccessManagementOutcome<T>
{
    public UserLicenseAccessManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static UserLicenseAccessManagementOutcome<T> Success(T result) =>
        new() { Error = UserLicenseAccessManagementError.None, Result = result };

    public static UserLicenseAccessManagementOutcome<T> Fail(
        UserLicenseAccessManagementError error,
        string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IUserLicenseAccessManagementService
{
    Task<UserLicenseAccessManagementOutcome<IReadOnlyList<MyLicenseAccessDto>>> GetMyAccessesAsync(
        string? userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserLicenseAccessDto>> GetAccessesAsync(CancellationToken cancellationToken = default);

    Task<UserLicenseAccessManagementOutcome<UserLicenseAccessDto>> CreateAccessAsync(
        CreateUserLicenseAccessDto dto,
        CancellationToken cancellationToken = default);

    Task<UserLicenseAccessManagementOutcome<bool>> UpdateAccessAsync(
        Guid id,
        UpdateUserLicenseAccessDto dto,
        CancellationToken cancellationToken = default);

    Task<UserLicenseAccessManagementOutcome<bool>> DeleteAccessAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class UserLicenseAccessManagementService(
    IUserLicenseAccessRepository accessRepository,
    UserManager<AppUser> userManager,
    ILicenseAccessService accessService,
    IOptions<BillingOptions> billingOptions,
    ILogger<UserLicenseAccessManagementService> logger) : IUserLicenseAccessManagementService
{
    private readonly BillingOptions _billingOptions = billingOptions.Value;

    public async Task<UserLicenseAccessManagementOutcome<IReadOnlyList<MyLicenseAccessDto>>> GetMyAccessesAsync(
        string? userId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return UserLicenseAccessManagementOutcome<IReadOnlyList<MyLicenseAccessDto>>.Fail(
                UserLicenseAccessManagementError.Unauthorized);
        }

        var accesses = await accessRepository.GetUserAccessesAsync(userId, cancellationToken);
        var licenses = await accessRepository.GetLicensesAsync(cancellationToken);

        var result = licenses.Select(license =>
        {
            var access = accesses.FirstOrDefault(x =>
                x.LicenseId == license.Id && accessService.IsCurrentlyActive(x));

            return new MyLicenseAccessDto(
                license.Id,
                license.Name,
                access is not null,
                access?.StartDate,
                access?.EndDate,
                access?.AccessSource,
                access?.IsDemoAccess ?? false,
                access?.GrantedAutomatically ?? false,
                access is null ? null : UserLicenseAccessRules.GetEffectiveExpiresAt(access));
        }).ToList();

        return UserLicenseAccessManagementOutcome<IReadOnlyList<MyLicenseAccessDto>>.Success(result);
    }

    public async Task<IReadOnlyList<UserSummaryDto>> GetUsersAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await userManager.Users
            .OrderBy(x => x.Email)
            .ToListAsync(cancellationToken);

        var result = new List<UserSummaryDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserSummaryDto(user.Id, user.Email ?? string.Empty, user.DisplayName, roles.ToList()));
        }

        return result;
    }

    public async Task<IReadOnlyList<UserLicenseAccessDto>> GetAccessesAsync(
        CancellationToken cancellationToken = default)
    {
        var accesses = await accessRepository.GetAllWithUserAndLicenseAsync(cancellationToken);
        return accesses.Select(x => ToDto(x, accessService.IsCurrentlyActive(x))).ToList();
    }

    public async Task<UserLicenseAccessManagementOutcome<UserLicenseAccessDto>> CreateAccessAsync(
        CreateUserLicenseAccessDto dto,
        CancellationToken cancellationToken = default)
    {
        if (IsPaymentSourceBlocked(dto.AccessSource))
        {
            logger.LogWarning(
                "Payment-sourced license grant blocked because payments are disabled. UserId: {UserId}, LicenseId: {LicenseId}",
                dto.UserId,
                dto.LicenseId);

            return UserLicenseAccessManagementOutcome<UserLicenseAccessDto>.Fail(
                UserLicenseAccessManagementError.PaymentDisabled,
                "Ödeme altyapısı kapalı. Lisans erişimini Admin, Manual veya Beta kaynağıyla verin.");
        }

        var user = await userManager.FindByIdAsync(dto.UserId);
        if (user is null)
        {
            return UserLicenseAccessManagementOutcome<UserLicenseAccessDto>.Fail(
                UserLicenseAccessManagementError.UserNotFound,
                "Kullanıcı bulunamadı.");
        }

        var license = await accessRepository.GetLicenseAsync(dto.LicenseId, cancellationToken);
        if (license is null)
        {
            return UserLicenseAccessManagementOutcome<UserLicenseAccessDto>.Fail(
                UserLicenseAccessManagementError.LicenseNotFound,
                "Lisans bulunamadı.");
        }

        var existingAccess = await accessRepository.GetByUserAndLicenseAsync(
            dto.UserId,
            dto.LicenseId,
            cancellationToken);

        if (existingAccess is not null)
        {
            return UserLicenseAccessManagementOutcome<UserLicenseAccessDto>.Fail(
                UserLicenseAccessManagementError.DuplicateAccess,
                "Bu kullanıcı için lisans erişimi zaten var.");
        }

        var access = new UserLicenseAccess
        {
            UserId = dto.UserId,
            LicenseId = dto.LicenseId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
            AccessSource = dto.AccessSource,
            User = user,
            License = license
        };

        await accessRepository.AddAsync(access, cancellationToken);
        await accessRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Manual license access created. AccessId: {AccessId}, UserId: {UserId}, LicenseId: {LicenseId}, Source: {AccessSource}, EndDate: {EndDate}",
            access.Id,
            access.UserId,
            access.LicenseId,
            access.AccessSource,
            access.EndDate);

        return UserLicenseAccessManagementOutcome<UserLicenseAccessDto>.Success(
            ToDto(access, accessService.IsCurrentlyActive(access)));
    }

    public async Task<UserLicenseAccessManagementOutcome<bool>> UpdateAccessAsync(
        Guid id,
        UpdateUserLicenseAccessDto dto,
        CancellationToken cancellationToken = default)
    {
        if (IsPaymentSourceBlocked(dto.AccessSource))
        {
            logger.LogWarning(
                "Payment-sourced license update blocked because payments are disabled. AccessId: {AccessId}",
                id);

            return UserLicenseAccessManagementOutcome<bool>.Fail(
                UserLicenseAccessManagementError.PaymentDisabled,
                "Ödeme altyapısı kapalı. Lisans erişimini Admin, Manual veya Beta kaynağıyla verin.");
        }

        var access = await accessRepository.GetByIdAsync(id, cancellationToken);
        if (access is null)
        {
            return UserLicenseAccessManagementOutcome<bool>.Fail(UserLicenseAccessManagementError.NotFound);
        }

        access.StartDate = dto.StartDate;
        access.EndDate = dto.EndDate;
        access.IsActive = dto.IsActive;
        access.AccessSource = dto.AccessSource;
        access.UpdatedAt = DateTime.UtcNow;

        await accessRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Manual license access updated. AccessId: {AccessId}, UserId: {UserId}, LicenseId: {LicenseId}, Source: {AccessSource}, IsActive: {IsActive}, EndDate: {EndDate}",
            access.Id,
            access.UserId,
            access.LicenseId,
            access.AccessSource,
            access.IsActive,
            access.EndDate);

        return UserLicenseAccessManagementOutcome<bool>.Success(true);
    }

    public async Task<UserLicenseAccessManagementOutcome<bool>> DeleteAccessAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var access = await accessRepository.GetByIdAsync(id, cancellationToken);
        if (access is null)
        {
            return UserLicenseAccessManagementOutcome<bool>.Fail(UserLicenseAccessManagementError.NotFound);
        }

        accessRepository.Remove(access);
        await accessRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Manual license access deleted. AccessId: {AccessId}, UserId: {UserId}, LicenseId: {LicenseId}",
            access.Id,
            access.UserId,
            access.LicenseId);

        return UserLicenseAccessManagementOutcome<bool>.Success(true);
    }

    private static UserLicenseAccessDto ToDto(UserLicenseAccess access, bool isCurrentlyActive)
    {
        return new UserLicenseAccessDto(
            access.Id,
            access.UserId,
            access.User?.Email ?? string.Empty,
            access.LicenseId,
            access.License?.Name ?? string.Empty,
            access.StartDate,
            access.EndDate,
            access.IsActive,
            isCurrentlyActive,
            access.AccessSource,
            access.CreatedAt);
    }

    private bool IsPaymentSourceBlocked(AccessSource source) =>
        source == AccessSource.Payment && !_billingOptions.PaymentsEnabled;
}
