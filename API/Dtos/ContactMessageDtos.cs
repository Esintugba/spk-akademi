using API.Entities;

namespace API.Dtos;

public record CreateContactMessageDto(
    string Name,
    string Email,
    string Subject,
    string Message,
    bool KvkkAccepted,
    bool CommercialElectronicMessages,
    string? Website,
    string? CaptchaToken);

public record ContactMessageResponseDto(
    Guid Id,
    string Message);

public record AdminContactMessageDto(
    Guid Id,
    string Name,
    string Email,
    string Subject,
    string Message,
    ContactMessageStatus Status,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt,
    DateTime? ReadAt,
    DateTime? RepliedAt,
    string? AssignedToUserId,
    string? AssignedToEmail,
    string? AdminNote);

public record AdminContactMessageListDto(
    IReadOnlyList<AdminContactMessageDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int UnreadCount);

public record ContactMessageQueryDto(
    ContactMessageStatus? Status,
    bool? UnreadOnly,
    DateTime? CreatedFrom,
    DateTime? CreatedTo,
    string? Email,
    string? Search,
    int Page = 1,
    int PageSize = 20);

public record UpdateContactMessageStatusDto(
    ContactMessageStatus Status,
    string? AdminNote,
    string? AssignedToUserId);
