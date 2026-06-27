using API.Entities;
using Microsoft.AspNetCore.Http;

namespace API.Dtos;

public class CreateSupportTicketDto
{
    public SupportTicketCategory Category { get; set; } = SupportTicketCategory.Other;

    public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Normal;

    public string Subject { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public IFormFile? Attachment { get; set; }
}

public class CreateSupportTicketMessageDto
{
    public string Message { get; set; } = string.Empty;

    public IFormFile? Attachment { get; set; }
}

public record SupportTicketSummaryDto(
    Guid Id,
    string TicketNumber,
    SupportTicketCategory Category,
    SupportTicketPriority Priority,
    string Subject,
    SupportTicketStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? ClosedAt,
    string? AssignedAdminId,
    string? AssignedAdminEmail,
    int MessageCount,
    DateTime LastActivityAt);

public record SupportTicketMessageDto(
    Guid Id,
    string SenderId,
    string? SenderName,
    string? SenderEmail,
    bool IsAdminReply,
    string Message,
    string? AttachmentUrl,
    DateTime CreatedAt);

public record SupportTicketStatusHistoryDto(
    Guid Id,
    SupportTicketStatus? OldStatus,
    SupportTicketStatus NewStatus,
    string? ChangedById,
    string? ChangedByEmail,
    string? Note,
    DateTime CreatedAt);

public record SupportTicketDetailDto(
    Guid Id,
    string TicketNumber,
    string UserId,
    string? UserEmail,
    string? UserDisplayName,
    SupportTicketCategory Category,
    SupportTicketPriority Priority,
    string Subject,
    string Description,
    SupportTicketStatus Status,
    string? AssignedAdminId,
    string? AssignedAdminEmail,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? ClosedAt,
    IReadOnlyList<SupportTicketMessageDto> Messages,
    IReadOnlyList<SupportTicketStatusHistoryDto> StatusHistory);

public record SupportTicketListDto(
    IReadOnlyList<SupportTicketSummaryDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public class SupportTicketQueryDto
{
    public SupportTicketStatus? Status { get; set; }

    public SupportTicketCategory? Category { get; set; }

    public SupportTicketPriority? Priority { get; set; }

    public string? AssignedAdminId { get; set; }

    public bool? UnassignedOnly { get; set; }

    public string? Search { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}

public class AdminUpdateSupportTicketDto
{
    public SupportTicketStatus? Status { get; set; }

    public SupportTicketPriority? Priority { get; set; }

    public string? AssignedAdminId { get; set; }

    public string? Note { get; set; }
}

public record StudentSupportDashboardDto(
    int OpenTickets,
    int WaitingForAdmin,
    int WaitingForUser,
    IReadOnlyList<SupportTicketSummaryDto> RecentTickets);

public record AdminSupportDashboardDto(
    int PendingTickets,
    int UnassignedTickets,
    int OpenedToday,
    int CriticalTickets);
