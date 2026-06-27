using API.Entities;

namespace API.Dtos;

public record StartQuizDto(
    QuizMode Mode,
    Guid? CourseId,
    Guid? TopicId,
    int QuestionCount);

public record QuizAttemptDto(
    Guid Id,
    QuizMode Mode,
    Guid? CourseId,
    Guid? TopicId,
    Guid? TrialExamId,
    DateTime StartedAt,
    DateTime? FinishedAt,
    int? DurationMinutes,
    DateTime? ExpiresAt,
    bool IsExpired,
    int TotalQuestions,
    int CorrectCount,
    int WrongCount,
    IReadOnlyList<QuizQuestionDto> Questions);

public record QuizQuestionDto(
    Guid Id,
    string Text,
    QuestionDifficulty Difficulty,
    QuestionType Type,
    IReadOnlyList<QuizQuestionOptionDto> Options);

public record QuizQuestionOptionDto(
    Guid Id,
    string Label,
    string Text);

public record SubmitQuizDto(
    IReadOnlyList<SubmitQuizAnswerDto> Answers);

public record SubmitQuizAnswerDto(
    Guid QuestionId,
    Guid? SelectedOptionId,
    int? TimeSpentSeconds = null);

public record QuizResultDto(
    Guid Id,
    int TotalQuestions,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    IReadOnlyList<QuizResultAnswerDto> Answers,
    IReadOnlyList<UnlockedBadgeDto> UnlockedBadges);

public record QuizResultAnswerDto(
    Guid QuestionId,
    Guid? SelectedOptionId,
    Guid CorrectOptionId,
    bool IsCorrect,
    string Explanation);

public record TrialExamSummaryDto(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    Guid? LicenseId,
    int DurationMinutes,
    int QuestionCount,
    bool IsFree,
    bool IsPublished,
    bool IsFeatured,
    QuestionDifficulty DifficultyLevel,
    string? Tags,
    decimal PopularityScore,
    int AssignedQuestionCount,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewComment);

public record TrialExamDetailDto(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    Guid? LicenseId,
    int DurationMinutes,
    int QuestionCount,
    bool IsFree,
    bool IsPublished,
    bool IsFeatured,
    QuestionDifficulty DifficultyLevel,
    string? Tags,
    decimal PopularityScore,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewComment,
    IReadOnlyList<Guid> QuestionIds);

public record CreateTrialExamDto(
    string Title,
    string Slug,
    string Description,
    Guid? LicenseId,
    int DurationMinutes,
    int QuestionCount,
    bool IsFree,
    bool IsPublished,
    bool IsFeatured,
    QuestionDifficulty DifficultyLevel,
    string? Tags,
    decimal PopularityScore,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    IReadOnlyList<Guid> QuestionIds);

public record UpdateTrialExamDto(
    string Title,
    string Slug,
    string Description,
    Guid? LicenseId,
    int DurationMinutes,
    int QuestionCount,
    bool IsFree,
    bool IsPublished,
    bool IsFeatured,
    QuestionDifficulty DifficultyLevel,
    string? Tags,
    decimal PopularityScore,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    IReadOnlyList<Guid> QuestionIds);

public record StartFreeTrialExamDto(Guid TrialExamId);

public record QuizCatalogQueryDto(
    int Page = 1,
    int PageSize = 20,
    string? Status = null,
    string? Difficulty = null,
    string? SortBy = null,
    Guid? LicenseId = null,
    Guid? CourseId = null,
    Guid? TopicId = null,
    bool? IsFree = null,
    string? Search = null);

public record QuizCatalogResponseDto(
    IReadOnlyList<QuizCatalogItemDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    bool HasNextPage);

public record StudentQuizProgressDto(
    bool Completed,
    bool InProgress,
    Guid? ActiveAttemptId,
    decimal? LastScore,
    DateTime? LastAttemptAt);

public record QuizCatalogItemDto(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    string? LicenseName,
    Guid? LicenseId,
    int QuestionCount,
    int Duration,
    QuestionDifficulty DifficultyLevel,
    int AttemptCount,
    decimal AverageScore,
    decimal CompletionRate,
    decimal AbandonRate,
    bool IsFree,
    bool HasAccess,
    bool IsFeatured,
    IReadOnlyList<string> Tags,
    StudentQuizProgressDto UserProgress);

public record FeaturedQuizDto(
    Guid Id,
    string Title,
    string? LicenseName,
    int QuestionCount,
    int Duration,
    QuestionDifficulty DifficultyLevel,
    decimal PopularityScore,
    decimal AverageScore,
    bool IsFree,
    bool HasAccess);

public record QuizOverviewDto(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    string? LicenseName,
    Guid? LicenseId,
    int QuestionCount,
    int Duration,
    QuestionDifficulty DifficultyLevel,
    int AttemptCount,
    decimal AverageScore,
    decimal CompletionRate,
    decimal AbandonRate,
    bool IsFree,
    bool HasAccess,
    bool IsFeatured,
    IReadOnlyList<string> Tags,
    IReadOnlyList<QuizQuestionDistributionDto> QuestionDistribution,
    StudentQuizProgressDto UserProgress);

public record QuizQuestionDistributionDto(
    Guid CourseId,
    string CourseName,
    Guid TopicId,
    string TopicTitle,
    int QuestionCount);

public record QuizAnalyticsDto(
    Guid QuizId,
    string Title,
    int AttemptCount,
    decimal CompletionRate,
    decimal AbandonRate,
    decimal AverageScore);
