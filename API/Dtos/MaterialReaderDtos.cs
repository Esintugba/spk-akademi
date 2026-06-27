using API.Entities;

namespace API.Dtos;

public record MaterialViewerDto(
    Guid MaterialId,
    string Title,
    int PageCount,
    string StreamUrl,
    int? ResumePage,
    decimal? ProgressPercentage,
    string? WatermarkText);

public record MaterialProgressDto(
    Guid MaterialId,
    int LastPage,
    decimal ProgressPercentage,
    int? SecondsReadDelta = null);

public record MaterialBookmarkDto(
    Guid Id,
    Guid MaterialId,
    int PageNumber,
    string Title,
    DateTime CreatedAt);

public record CreateMaterialBookmarkDto(
    int PageNumber,
    string Title);

public record MaterialNoteDto(
    Guid Id,
    Guid MaterialId,
    int PageNumber,
    string? SelectedText,
    string Note,
    MaterialHighlightColor HighlightColor,
    bool IsFavorite,
    string? FolderName,
    IReadOnlyList<string> Tags,
    bool IsInReview,
    int ReviewRepetition,
    int ReviewIntervalDays,
    DateTime? NextReviewAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record MyMaterialNoteDto(
    Guid Id,
    Guid MaterialId,
    string MaterialTitle,
    Guid CourseId,
    string CourseName,
    int PageNumber,
    string? SelectedText,
    string Note,
    MaterialHighlightColor HighlightColor,
    bool IsFavorite,
    string? FolderName,
    IReadOnlyList<string> Tags,
    bool IsInReview,
    int ReviewRepetition,
    int ReviewIntervalDays,
    DateTime? NextReviewAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record CreateMaterialNoteDto(
    int PageNumber,
    string? SelectedText,
    string Note,
    MaterialHighlightColor HighlightColor,
    string? FolderName = null,
    IReadOnlyList<string>? Tags = null);

public record UpdateMaterialNoteDto(
    string? Note,
    MaterialHighlightColor? HighlightColor,
    bool? IsFavorite,
    string? FolderName = null,
    IReadOnlyList<string>? Tags = null,
    bool? IsInReview = null);

public record ReviewMaterialNoteDto(
    Guid Id,
    Guid MaterialId,
    string MaterialTitle,
    int PageNumber,
    string Prompt,
    string Answer,
    string? FolderName,
    IReadOnlyList<string> Tags,
    int Repetition,
    int IntervalDays,
    DateTime? NextReviewAt);

public record SubmitMaterialNoteReviewDto(int Quality);

public record MaterialNoteReviewResultDto(
    Guid NoteId,
    int Repetition,
    int IntervalDays,
    DateTime NextReviewAt);

public record ReadingHistoryItemDto(
    Guid MaterialId,
    string Title,
    int LastPage,
    decimal ProgressPercentage,
    DateTime LastOpenedAt,
    DateTime? CompletedAt,
    int TotalSecondsRead);

public record MaterialLibraryItemDto(
    Guid MaterialId,
    Guid CourseId,
    string CourseName,
    string Title,
    string SourceName,
    int PageCount,
    DateTime? LastOpenedAt,
    int? LastPage,
    decimal? ProgressPercentage);

public record ReadingAnalyticsDto(
    int TotalSecondsRead,
    int CompletedMaterialCount,
    int ActiveMaterialCount,
    IReadOnlyList<ReadingTopMaterialDto> TopMaterialsByNotes,
    IReadOnlyList<ReadingDailyStatDto> DailyReadSeconds);

public record ReadingTopMaterialDto(
    Guid MaterialId,
    string Title,
    int NoteCount);

public record ReadingDailyStatDto(
    string Date,
    int SecondsRead);

