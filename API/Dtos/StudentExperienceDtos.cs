using API.Entities;

namespace API.Dtos;

public record StudentProgramDto(
    IReadOnlyList<StudentProgramLicenseDto> Licenses,
    StudentContinueLearningDto? ContinueLearning,
    StudentContinueTrialDto? ContinueTrial,
    IReadOnlyList<StudentUpcomingGoalDto> UpcomingGoals);

public record StudentProgramLicenseDto(
    Guid LicenseId,
    string LicenseName,
    bool HasAccess,
    decimal ProgressPercentage,
    int CompletedCourseCount,
    int TotalCourseCount,
    string? LastStudiedCourseName,
    DateTime? LastActivityAt);

public record StudentContinueLearningDto(
    Guid LicenseId,
    string LicenseName,
    Guid CourseId,
    string CourseName,
    Guid TopicId,
    string TopicTitle,
    DateTime? LastStudiedAt);

public record StudentContinueTrialDto(
    Guid AttemptId,
    Guid TrialExamId,
    string TrialTitle,
    int QuestionCount,
    int? DurationMinutes,
    DateTime StartedAt,
    DateTime? ExpiresAt);

public record StudentUpcomingGoalDto(
    Guid TopicId,
    Guid CourseId,
    string CourseName,
    string TopicTitle,
    DateTime? NextReviewAt,
    StudyStatus Status);

public record TopicStudyPageDto(
    Guid TopicId,
    Guid CourseId,
    Guid LicenseId,
    string LicenseName,
    string CourseName,
    string TopicTitle,
    TopicType Type,
    string? Summary,
    string? ImportantPoints,
    string? CommonMistakes,
    string? Formulas,
    StudyStatus Status,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    DateTime? LastStudiedAt,
    DateTime? NextReviewAt,
    bool IsCompleted,
    StudentTopicVideoPlaceholderDto Video,
    IReadOnlyList<StudyNoteDto> Notes,
    IReadOnlyList<SourceDocumentDto> SourceDocuments,
    IReadOnlyList<TopicQuestionPreviewDto> RelatedQuestions,
    IReadOnlyList<TopicStudySubTopicDto> SubTopics);

public record TopicStudySubTopicDto(
    Guid TopicId,
    string Title,
    string? Summary,
    int QuestionCount,
    StudyStatus Status,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    bool IsCompleted);

public record StudentTopicVideoPlaceholderDto(
    bool IsAvailable,
    string Title,
    string Description);

public record TopicQuestionPreviewDto(
    Guid QuestionId,
    string Text,
    QuestionDifficulty Difficulty,
    QuestionType Type);

public record MarkTopicCompletedDto(bool IsCompleted);

public record StudentAnalyticsDto(
    decimal SuccessRate,
    int TotalSolvedQuestions,
    int TotalSolvedQuizzes,
    int TodaySolvedQuestions,
    int WeeklySolvedQuestions,
    decimal EstimatedDailyStudyMinutes,
    decimal EstimatedWeeklyStudyMinutes,
    IReadOnlyList<AnalyticsTopicStrengthDto> StrongTopics,
    IReadOnlyList<AnalyticsTopicStrengthDto> WeakTopics,
    IReadOnlyList<ProgressTimelinePointDto> DailyTrend,
    IReadOnlyList<ProgressTimelinePointDto> WeeklyTrend,
    IReadOnlyList<StudentTrialPerformanceDto> TrialPerformances);

public record AnalyticsTopicStrengthDto(
    Guid TopicId,
    Guid CourseId,
    string CourseName,
    string TopicTitle,
    StudyStatus Status,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    DateTime? LastStudiedAt);

public record StudentTrialPerformanceDto(
    Guid AttemptId,
    Guid TrialExamId,
    string TrialTitle,
    int CorrectCount,
    int WrongCount,
    int TotalQuestions,
    decimal SuccessRate,
    int? DurationMinutes,
    int UsedMinutes,
    DateTime FinishedAt);

public record TrialAttemptSummaryDto(
    Guid AttemptId,
    Guid TrialExamId,
    string TrialTitle,
    int CorrectCount,
    int WrongCount,
    int TotalQuestions,
    decimal SuccessRate,
    int? DurationMinutes,
    int UsedMinutes,
    DateTime StartedAt,
    DateTime? FinishedAt,
    bool IsCompleted);

public record QuizResultHistoryItemDto(
    Guid AttemptId,
    string Title,
    QuizMode Mode,
    Guid? CourseId,
    string? CourseName,
    Guid? TopicId,
    string? TopicName,
    int CorrectCount,
    int WrongCount,
    int EmptyCount,
    int TotalQuestions,
    decimal SuccessRate,
    int DurationSeconds,
    DateTime StartedAt,
    DateTime FinishedAt);

public record TrialAttemptDetailDto(
    Guid AttemptId,
    Guid TrialExamId,
    string TrialTitle,
    int CorrectCount,
    int WrongCount,
    int TotalQuestions,
    decimal SuccessRate,
    int? DurationMinutes,
    int UsedMinutes,
    DateTime StartedAt,
    DateTime? FinishedAt,
    IReadOnlyList<TrialAttemptAnswerDto> Answers);

public record TrialAttemptAnswerDto(
    Guid QuestionId,
    string QuestionText,
    Guid? SelectedOptionId,
    Guid CorrectOptionId,
    bool IsCorrect,
    string Explanation);

public record AccountProfileDto(
    string Email,
    string DisplayName,
    string Role);

public record UpdateAccountProfileDto(
    string DisplayName);

public record ChangePasswordDto(
    string CurrentPassword,
    string NewPassword);
