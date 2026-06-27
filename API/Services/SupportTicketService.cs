using System.Net;
using System.Text.RegularExpressions;
using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum SupportTicketError
{
    None,
    NotFound,
    Forbidden,
    InvalidState,
    InvalidAttachment
}

public interface ISupportTicketService
{
    Task<IReadOnlyList<SupportTicketSummaryDto>> GetMyTicketsAsync(string userId, CancellationToken cancellationToken = default);

    Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> CreateTicketAsync(
        string userId,
        CreateSupportTicketDto dto,
        CancellationToken cancellationToken = default);

    Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> GetMyTicketAsync(
        string userId,
        Guid ticketId,
        CancellationToken cancellationToken = default);

    Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> AddUserMessageAsync(
        string userId,
        Guid ticketId,
        CreateSupportTicketMessageDto dto,
        CancellationToken cancellationToken = default);

    Task<SupportTicketListDto> GetAdminTicketsAsync(
        SupportTicketQueryDto query,
        CancellationToken cancellationToken = default);

    Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> GetAdminTicketAsync(
        Guid ticketId,
        CancellationToken cancellationToken = default);

    Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> AddAdminMessageAsync(
        string adminId,
        Guid ticketId,
        CreateSupportTicketMessageDto dto,
        CancellationToken cancellationToken = default);

    Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> UpdateAdminTicketAsync(
        string adminId,
        Guid ticketId,
        AdminUpdateSupportTicketDto dto,
        CancellationToken cancellationToken = default);

    Task<StudentSupportDashboardDto> GetStudentDashboardAsync(string userId, CancellationToken cancellationToken = default);

    Task<AdminSupportDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default);
}

public class SupportTicketService(
    DataContext context,
    IWebHostEnvironment environment) : ISupportTicketService
{
    private static readonly Regex TagRegex = new("<.*?>", RegexOptions.Compiled);
    private static readonly Regex ControlRegex = new("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", RegexOptions.Compiled);
    private static readonly HashSet<string> AllowedAttachmentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".pdf",
        ".doc",
        ".docx",
        ".txt"
    };

    private const long MaxAttachmentBytes = 8 * 1024 * 1024;

    public async Task<IReadOnlyList<SupportTicketSummaryDto>> GetMyTicketsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var tickets = await BaseTicketQuery()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .ToListAsync(cancellationToken);

        return tickets.Select(ToSummaryDto).ToList();
    }

    public async Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> CreateTicketAsync(
        string userId,
        CreateSupportTicketDto dto,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var ticket = new SupportTicket
        {
            TicketNumber = await GenerateTicketNumberAsync(now, cancellationToken),
            UserId = userId,
            Category = dto.Category,
            Priority = dto.Priority,
            Subject = SanitizeSingleLine(dto.Subject, 180),
            Description = SanitizeMultiline(dto.Description, 4000),
            Status = SupportTicketStatus.Open,
            CreatedAt = now,
            UpdatedAt = now
        };

        var message = new SupportTicketMessage
        {
            Ticket = ticket,
            SenderId = userId,
            Message = ticket.Description,
            IsAdminReply = false,
            CreatedAt = now
        };

        if (dto.Attachment is not null)
        {
            var (error, url) = await StoreAttachmentAsync(ticket.Id, dto.Attachment, cancellationToken);
            if (error != SupportTicketError.None)
            {
                return (error, null);
            }

            message.AttachmentUrl = url;
        }

        ticket.Messages.Add(message);
        ticket.StatusHistory.Add(new SupportTicketStatusHistory
        {
            Ticket = ticket,
            ChangedById = userId,
            OldStatus = null,
            NewStatus = SupportTicketStatus.Open,
            Note = "Talep oluşturuldu.",
            CreatedAt = now
        });

        context.SupportTickets.Add(ticket);
        await AddNotificationAsync(ticket, null, SupportTicketNotificationType.NewTicketCreated, "Yeni destek talebi", $"{ticket.TicketNumber} numaralı talep oluşturuldu.", now, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return (SupportTicketError.None, await GetTicketDetailAsync(ticket.Id, cancellationToken));
    }

    public async Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> GetMyTicketAsync(
        string userId,
        Guid ticketId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketEntityAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            return (SupportTicketError.NotFound, null);
        }

        if (!string.Equals(ticket.UserId, userId, StringComparison.Ordinal))
        {
            return (SupportTicketError.Forbidden, null);
        }

        return (SupportTicketError.None, ToDetailDto(ticket));
    }

    public async Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> AddUserMessageAsync(
        string userId,
        Guid ticketId,
        CreateSupportTicketMessageDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketEntityAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            return (SupportTicketError.NotFound, null);
        }

        if (!string.Equals(ticket.UserId, userId, StringComparison.Ordinal))
        {
            return (SupportTicketError.Forbidden, null);
        }

        if (ticket.Status == SupportTicketStatus.Closed)
        {
            return (SupportTicketError.InvalidState, null);
        }

        var now = DateTime.UtcNow;
        var message = new SupportTicketMessage
        {
            TicketId = ticket.Id,
            SenderId = userId,
            Message = SanitizeMultiline(dto.Message, 4000),
            IsAdminReply = false,
            CreatedAt = now
        };

        if (dto.Attachment is not null)
        {
            var (error, url) = await StoreAttachmentAsync(ticket.Id, dto.Attachment, cancellationToken);
            if (error != SupportTicketError.None)
            {
                return (error, null);
            }

            message.AttachmentUrl = url;
        }

        context.SupportTicketMessages.Add(message);
        var oldStatus = ticket.Status;
        if (ticket.Status == SupportTicketStatus.WaitingForUser || ticket.Status == SupportTicketStatus.Resolved)
        {
            ticket.Status = SupportTicketStatus.InProgress;
            AddStatusHistory(ticket, userId, oldStatus, ticket.Status, "Kullanıcı yanıtı verdi.", now);
        }

        ticket.UpdatedAt = now;
        await AddNotificationAsync(ticket, ticket.AssignedAdminId, SupportTicketNotificationType.UserReplied, "Destek talebine kullanıcı yanıtı", $"{ticket.TicketNumber} numaralı talebe kullanıcı yanıtı verdi.", now, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return (SupportTicketError.None, await GetTicketDetailAsync(ticket.Id, cancellationToken));
    }

    public async Task<SupportTicketListDto> GetAdminTicketsAsync(
        SupportTicketQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var ticketsQuery = BaseTicketQuery();

        if (query.Status is not null)
        {
            ticketsQuery = ticketsQuery.Where(x => x.Status == query.Status);
        }

        if (query.Category is not null)
        {
            ticketsQuery = ticketsQuery.Where(x => x.Category == query.Category);
        }

        if (query.Priority is not null)
        {
            ticketsQuery = ticketsQuery.Where(x => x.Priority == query.Priority);
        }

        if (query.UnassignedOnly == true)
        {
            ticketsQuery = ticketsQuery.Where(x => x.AssignedAdminId == null || x.AssignedAdminId == string.Empty);
        }
        else if (!string.IsNullOrWhiteSpace(query.AssignedAdminId))
        {
            ticketsQuery = ticketsQuery.Where(x => x.AssignedAdminId == query.AssignedAdminId);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            ticketsQuery = ticketsQuery.Where(x =>
                x.TicketNumber.Contains(search) ||
                x.Subject.Contains(search) ||
                x.Description.Contains(search) ||
                (x.User != null && x.User.Email != null && x.User.Email.Contains(search)));
        }

        var totalCount = await ticketsQuery.CountAsync(cancellationToken);
        var tickets = await ticketsQuery
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new SupportTicketListDto(tickets.Select(ToSummaryDto).ToList(), totalCount, page, pageSize);
    }

    public async Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> GetAdminTicketAsync(
        Guid ticketId,
        CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketEntityAsync(ticketId, cancellationToken);
        return ticket is null
            ? (SupportTicketError.NotFound, null)
            : (SupportTicketError.None, ToDetailDto(ticket));
    }

    public async Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> AddAdminMessageAsync(
        string adminId,
        Guid ticketId,
        CreateSupportTicketMessageDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketEntityAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            return (SupportTicketError.NotFound, null);
        }

        if (ticket.Status == SupportTicketStatus.Closed)
        {
            return (SupportTicketError.InvalidState, null);
        }

        var now = DateTime.UtcNow;
        var message = new SupportTicketMessage
        {
            TicketId = ticket.Id,
            SenderId = adminId,
            Message = SanitizeMultiline(dto.Message, 4000),
            IsAdminReply = true,
            CreatedAt = now
        };

        if (dto.Attachment is not null)
        {
            var (error, url) = await StoreAttachmentAsync(ticket.Id, dto.Attachment, cancellationToken);
            if (error != SupportTicketError.None)
            {
                return (error, null);
            }

            message.AttachmentUrl = url;
        }

        context.SupportTicketMessages.Add(message);
        ticket.AssignedAdminId ??= adminId;
        var oldStatus = ticket.Status;
        if (ticket.Status is SupportTicketStatus.Open or SupportTicketStatus.InProgress)
        {
            ticket.Status = SupportTicketStatus.WaitingForUser;
            AddStatusHistory(ticket, adminId, oldStatus, ticket.Status, "Admin yanıtı verdi.", now);
        }

        ticket.UpdatedAt = now;
        await AddNotificationAsync(ticket, ticket.UserId, SupportTicketNotificationType.AdminReplied, "Destek talebine admin yanıtı", $"{ticket.TicketNumber} numaralı talebinize admin yanıtı verildi.", now, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return (SupportTicketError.None, await GetTicketDetailAsync(ticket.Id, cancellationToken));
    }

    public async Task<(SupportTicketError Error, SupportTicketDetailDto? Result)> UpdateAdminTicketAsync(
        string adminId,
        Guid ticketId,
        AdminUpdateSupportTicketDto dto,
        CancellationToken cancellationToken = default)
    {
        var ticket = await GetTicketEntityAsync(ticketId, cancellationToken);
        if (ticket is null)
        {
            return (SupportTicketError.NotFound, null);
        }

        var now = DateTime.UtcNow;
        if (dto.Priority is not null)
        {
            ticket.Priority = dto.Priority.Value;
        }

        if (dto.AssignedAdminId is not null)
        {
            ticket.AssignedAdminId = string.IsNullOrWhiteSpace(dto.AssignedAdminId)
                ? null
                : dto.AssignedAdminId.Trim();
        }

        if (dto.Status is not null && dto.Status != ticket.Status)
        {
            var oldStatus = ticket.Status;
            ticket.Status = dto.Status.Value;
            ticket.ClosedAt = ticket.Status == SupportTicketStatus.Closed ? now : null;
            AddStatusHistory(ticket, adminId, oldStatus, ticket.Status, SanitizeMultiline(dto.Note ?? string.Empty, 1000), now);

            if (ticket.Status == SupportTicketStatus.Resolved)
            {
                await AddNotificationAsync(ticket, ticket.UserId, SupportTicketNotificationType.TicketResolved, "Destek talebi çözüldü", $"{ticket.TicketNumber} numaralı talebiniz çözüldü olarak işaretlendi.", now, cancellationToken);
            }

            if (ticket.Status == SupportTicketStatus.Closed)
            {
                await AddNotificationAsync(ticket, ticket.UserId, SupportTicketNotificationType.TicketClosed, "Destek talebi kapatıldı", $"{ticket.TicketNumber} numaralı talebiniz kapatıldı.", now, cancellationToken);
            }
        }

        ticket.UpdatedAt = now;
        await context.SaveChangesAsync(cancellationToken);

        return (SupportTicketError.None, await GetTicketDetailAsync(ticket.Id, cancellationToken));
    }

    public async Task<StudentSupportDashboardDto> GetStudentDashboardAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var query = context.SupportTickets.AsNoTracking().Where(x => x.UserId == userId);
        var openTickets = await query.CountAsync(x => x.Status != SupportTicketStatus.Resolved && x.Status != SupportTicketStatus.Closed, cancellationToken);
        var waitingForAdmin = await query.CountAsync(x => x.Status == SupportTicketStatus.Open || x.Status == SupportTicketStatus.InProgress, cancellationToken);
        var waitingForUser = await query.CountAsync(x => x.Status == SupportTicketStatus.WaitingForUser, cancellationToken);
        var recent = await BaseTicketQuery()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        return new StudentSupportDashboardDto(openTickets, waitingForAdmin, waitingForUser, recent.Select(ToSummaryDto).ToList());
    }

    public async Task<AdminSupportDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var query = context.SupportTickets.AsNoTracking();
        var pending = await query.CountAsync(x =>
            x.Status == SupportTicketStatus.Open ||
            x.Status == SupportTicketStatus.InProgress ||
            x.Status == SupportTicketStatus.WaitingForUser, cancellationToken);
        var unassigned = await query.CountAsync(x => x.AssignedAdminId == null || x.AssignedAdminId == string.Empty, cancellationToken);
        var openedToday = await query.CountAsync(x => x.CreatedAt >= today && x.CreatedAt < tomorrow, cancellationToken);
        var critical = await query.CountAsync(x =>
            x.Priority == SupportTicketPriority.Critical &&
            x.Status != SupportTicketStatus.Resolved &&
            x.Status != SupportTicketStatus.Closed, cancellationToken);

        return new AdminSupportDashboardDto(pending, unassigned, openedToday, critical);
    }

    private IQueryable<SupportTicket> BaseTicketQuery() =>
        context.SupportTickets
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.AssignedAdmin)
            .Include(x => x.Messages)
                .ThenInclude(x => x.Sender)
            .Include(x => x.StatusHistory)
                .ThenInclude(x => x.ChangedBy);

    private Task<SupportTicket?> GetTicketEntityAsync(Guid ticketId, CancellationToken cancellationToken) =>
        context.SupportTickets
            .Include(x => x.User)
            .Include(x => x.AssignedAdmin)
            .Include(x => x.Messages)
                .ThenInclude(x => x.Sender)
            .Include(x => x.StatusHistory)
                .ThenInclude(x => x.ChangedBy)
            .FirstOrDefaultAsync(x => x.Id == ticketId, cancellationToken);

    private async Task<SupportTicketDetailDto> GetTicketDetailAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        var ticket = await BaseTicketQuery().FirstAsync(x => x.Id == ticketId, cancellationToken);
        return ToDetailDto(ticket);
    }

    private static SupportTicketSummaryDto ToSummaryDto(SupportTicket ticket)
    {
        var lastMessageAt = ticket.Messages.Count == 0
            ? ticket.UpdatedAt ?? ticket.CreatedAt
            : ticket.Messages.Max(x => x.CreatedAt);

        return new SupportTicketSummaryDto(
            ticket.Id,
            ticket.TicketNumber,
            ticket.Category,
            ticket.Priority,
            ticket.Subject,
            ticket.Status,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            ticket.ClosedAt,
            ticket.AssignedAdminId,
            ticket.AssignedAdmin?.Email,
            ticket.Messages.Count,
            lastMessageAt);
    }

    private static SupportTicketDetailDto ToDetailDto(SupportTicket ticket) =>
        new(
            ticket.Id,
            ticket.TicketNumber,
            ticket.UserId,
            ticket.User?.Email,
            ticket.User?.DisplayName,
            ticket.Category,
            ticket.Priority,
            ticket.Subject,
            ticket.Description,
            ticket.Status,
            ticket.AssignedAdminId,
            ticket.AssignedAdmin?.Email,
            ticket.CreatedAt,
            ticket.UpdatedAt,
            ticket.ClosedAt,
            ticket.Messages
                .OrderBy(x => x.CreatedAt)
                .Select(x => new SupportTicketMessageDto(
                    x.Id,
                    x.SenderId,
                    x.Sender?.DisplayName,
                    x.Sender?.Email,
                    x.IsAdminReply,
                    x.Message,
                    x.AttachmentUrl,
                    x.CreatedAt))
                .ToList(),
            ticket.StatusHistory
                .OrderBy(x => x.CreatedAt)
                .Select(x => new SupportTicketStatusHistoryDto(
                    x.Id,
                    x.OldStatus,
                    x.NewStatus,
                    x.ChangedById,
                    x.ChangedBy?.Email,
                    x.Note,
                    x.CreatedAt))
                .ToList());

    private async Task<string> GenerateTicketNumberAsync(DateTime now, CancellationToken cancellationToken)
    {
        var prefix = $"SPK-{now:yyyyMMdd}-";
        var todayCount = await context.SupportTickets
            .AsNoTracking()
            .CountAsync(x => x.TicketNumber.StartsWith(prefix), cancellationToken);

        return $"{prefix}{todayCount + 1:0000}";
    }

    private async Task<(SupportTicketError Error, string? Url)> StoreAttachmentAsync(
        Guid ticketId,
        IFormFile attachment,
        CancellationToken cancellationToken)
    {
        if (attachment.Length <= 0 || attachment.Length > MaxAttachmentBytes)
        {
            return (SupportTicketError.InvalidAttachment, null);
        }

        var extension = Path.GetExtension(attachment.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedAttachmentExtensions.Contains(extension))
        {
            return (SupportTicketError.InvalidAttachment, null);
        }

        var relativeDirectory = Path.Combine("uploads", "support-tickets", ticketId.ToString("N"));
        var absoluteDirectory = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), relativeDirectory);
        Directory.CreateDirectory(absoluteDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var absolutePath = Path.Combine(absoluteDirectory, fileName);
        await using var stream = File.Create(absolutePath);
        await attachment.CopyToAsync(stream, cancellationToken);

        return (SupportTicketError.None, $"/uploads/support-tickets/{ticketId:N}/{fileName}");
    }

    private static void AddStatusHistory(
        SupportTicket ticket,
        string? changedById,
        SupportTicketStatus oldStatus,
        SupportTicketStatus newStatus,
        string? note,
        DateTime now) =>
        ticket.StatusHistory.Add(new SupportTicketStatusHistory
        {
            TicketId = ticket.Id,
            ChangedById = changedById,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Note = string.IsNullOrWhiteSpace(note) ? null : note,
            CreatedAt = now
        });

    private async Task AddNotificationAsync(
        SupportTicket ticket,
        string? recipientUserId,
        SupportTicketNotificationType type,
        string title,
        string message,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(recipientUserId))
        {
            var supportUpdatesEnabled = await context.UserSettings
                .AsNoTracking()
                .Where(x => x.UserId == recipientUserId)
                .Select(x => x.SupportTicketUpdates)
                .FirstOrDefaultAsync(cancellationToken);

            if (!supportUpdatesEnabled && await context.UserSettings.AsNoTracking().AnyAsync(x => x.UserId == recipientUserId, cancellationToken))
            {
                return;
            }
        }

        context.SupportTicketNotifications.Add(new SupportTicketNotification
        {
            Ticket = ticket,
            RecipientUserId = recipientUserId,
            Type = type,
            Title = title,
            Message = message,
            CreatedAt = now
        });
    }

    private static string SanitizeSingleLine(string value, int maxLength)
    {
        var stripped = TagRegex.Replace(value ?? string.Empty, string.Empty).Trim();
        stripped = Regex.Replace(stripped, "[\\r\\n]+", " ");
        stripped = ControlRegex.Replace(stripped, string.Empty);
        var decoded = WebUtility.HtmlDecode(stripped);
        return decoded[..Math.Min(decoded.Length, maxLength)];
    }

    private static string SanitizeMultiline(string value, int maxLength)
    {
        var stripped = TagRegex.Replace(value ?? string.Empty, string.Empty).Trim();
        stripped = ControlRegex.Replace(stripped, string.Empty);
        var decoded = WebUtility.HtmlDecode(stripped);
        return decoded[..Math.Min(decoded.Length, maxLength)];
    }
}
