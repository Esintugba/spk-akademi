using API.Entities;

namespace API.Dtos;

public record CreateAccessRequestDto(
    Guid PlanId,
    string? Message);

public record AccessRequestResponseDto(
    Guid Id,
    Guid PlanId,
    string PlanName,
    AccessRequestStatus Status,
    DateTime RequestedAt,
    string? Message,
    string? AdminNote,
    DateTime? ReviewedAt,
    bool EmailSent);

public record UpdateAccessRequestStatusDto(
    AccessRequestStatus Status,
    string? AdminNote);

public record AdminAccessRequestDto(
    Guid Id,
    string StudentId,
    string StudentEmail,
    string? StudentDisplayName,
    Guid PlanId,
    string PlanName,
    AccessRequestStatus Status,
    string? Message,
    string? AdminNote,
    DateTime RequestedAt,
    DateTime? ReviewedAt,
    string? ReviewedByEmail,
    bool EmailSent);

public record AdminAccessRequestListDto(
    IReadOnlyList<AdminAccessRequestDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public record AccessRequestQueryDto(
    AccessRequestStatus? Status,
    Guid? PlanId,
    string? UserId,
    bool? Reviewed,
    DateTime? RequestedFrom,
    DateTime? RequestedTo,
    int Page = 1,
    int PageSize = 20);
