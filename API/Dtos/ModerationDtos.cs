using API.Entities;

namespace API.Dtos;

public enum ModerationContentType
{
    Question = 1,
    StudyNote = 2,
    SourceDocument = 3,
    TrialExam = 4
}

public record ModerationItemDto(
    ModerationContentType ContentType,
    Guid ContentId,
    string Title,
    string? Subtitle,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    bool IsAiGenerated,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewComment);

public record ModerationHistoryDto(
    Guid Id,
    ReviewStatus FromStatus,
    ReviewStatus ToStatus,
    string? Reviewer,
    string? Comment,
    DateTime CreatedAt);

public record ModerationListResponseDto(
    IReadOnlyList<ModerationItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public record ModerateContentRequestDto(
    ModerationContentType ContentType,
    Guid ContentId,
    ReviewStatus ReviewStatus,
    string? ReviewComment,
    ContentAccessLevel? AccessLevel);

public record BulkModerateContentRequestDto(
    IReadOnlyList<ModerateContentRequestDto> Items);
