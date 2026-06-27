using API.Entities;

namespace API.Dtos;

public record ProgressOverviewDto(
    int ActiveLicenseCount,
    int TotalCourseCount,
    int CompletedCourseCount,
    int TotalTopicCount,
    int StudiedTopicCount,
    int NeedsReviewTopicCount,
    int MasteredTopicCount,
    int SolvedQuizCount,
    int TotalQuestionCount,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    DateTime? LastActivityAt,
    ProgressDailyGoalDto DailyGoal,
    IReadOnlyList<ProgressRecentCourseDto> RecentCourses,
    IReadOnlyList<ProgressRecentActivityDto> RecentActivities,
    IReadOnlyList<ProgressUpcomingReviewDto> UpcomingReviews);

public record ProgressDailyGoalDto(
    int TargetQuestionCount,
    int CompletedQuestionCount,
    decimal CompletionRate);

public record ProgressRecentCourseDto(
    Guid CourseId,
    Guid LicenseId,
    string LicenseName,
    string CourseName,
    int StudiedTopicCount,
    int TotalTopicCount,
    decimal ProgressPercentage,
    DateTime? LastActivityAt);

public record ProgressRecentActivityDto(
    Guid TopicId,
    Guid CourseId,
    Guid LicenseId,
    string LicenseName,
    string CourseName,
    string TopicTitle,
    StudyStatus Status,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    DateTime? LastStudiedAt,
    DateTime? NextReviewAt);

public record ProgressUpcomingReviewDto(
    Guid TopicId,
    Guid CourseId,
    string CourseName,
    string TopicTitle,
    DateTime? NextReviewAt,
    StudyStatus Status);

public record LicenseProgressDto(
    Guid LicenseId,
    string LicenseName,
    int TotalCourseCount,
    int CompletedCourseCount,
    int TotalTopicCount,
    int StudiedTopicCount,
    int NeedsReviewTopicCount,
    int MasteredTopicCount,
    int TotalQuestionCount,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    decimal ProgressPercentage,
    DateTime? LastActivityAt);

public record CourseProgressDto(
    Guid CourseId,
    Guid LicenseId,
    string LicenseName,
    string CourseName,
    int TotalTopicCount,
    int StudiedTopicCount,
    int CompletedTopicCount,
    int NeedsReviewTopicCount,
    int MasteredTopicCount,
    int TotalQuestionCount,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    decimal ProgressPercentage,
    DateTime? LastActivityAt,
    IReadOnlyList<CourseTopicProgressDto> Topics);

public record CourseTopicProgressDto(
    Guid TopicId,
    string TopicTitle,
    int Order,
    int QuestionCount,
    int StudyNoteCount,
    int SourceDocumentCount,
    int WrongAnswerQueueCount,
    int DueReviewCount,
    StudyStatus Status,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    DateTime? LastStudiedAt,
    DateTime? NextReviewAt);

public record ProgressStatisticsDto(
    int SolvedQuizCount,
    int TotalQuestionCount,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    int TodayQuizCount,
    int WeeklyQuizCount,
    int TodayQuestionCount,
    int WeeklyQuestionCount,
    IReadOnlyList<ProgressTimelinePointDto> DailyTimeline,
    IReadOnlyList<ProgressTimelinePointDto> WeeklyTimeline);

public record ProgressTimelinePointDto(
    string Label,
    DateTime PeriodStart,
    int QuizCount,
    int QuestionCount,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate);
