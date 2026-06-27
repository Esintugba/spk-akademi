using API.Entities;

namespace API.Dtos;

public record TodayReviewDto(
    IReadOnlyList<TodayReviewItemDto> Items,
    TodayReviewSummaryDto Summary);

public record TodayReviewSummaryDto(
    int DueTodayCount,
    int MasteredCount,
    int DailyStreak,
    decimal AverageSuccessRate);

public record TodayReviewItemDto(
    Guid QuestionId,
    string QuestionText,
    Guid TopicId,
    string TopicTitle,
    string CourseName,
    MasteryLevel MasteryLevel,
    DateTime? NextReviewAt,
    decimal CorrectRate,
    int IntervalDays,
    decimal EaseFactor);

public record StartReviewSessionRequestDto(int MaxQuestions = 20);

public record ReviewSessionResponseDto(
    Guid SessionId,
    DateTime StartedAt,
    DateTime ExpiresAt,
    int QuestionCount,
    IReadOnlyList<ReviewSessionQuestionDto> Questions);

public record ReviewSessionQuestionDto(
    Guid QuestionId,
    int Order,
    string QuestionText,
    MasteryLevel MasteryLevel,
    IReadOnlyList<QuizQuestionOptionDto> Options);

public record SubmitReviewSessionDto(
    Guid SessionId,
    IReadOnlyList<SubmitReviewAnswerDto> Answers);

public record SubmitReviewAnswerDto(
    Guid QuestionId,
    int Quality,
    bool? AnsweredCorrect,
    int? ResponseTimeSeconds);

public record SubmitReviewSessionResultDto(
    Guid SessionId,
    int QuestionCount,
    int CorrectCount,
    decimal AverageQuality,
    decimal RetentionRate,
    IReadOnlyList<ReviewAnswerResultDto> Results,
    IReadOnlyList<UnlockedBadgeDto> UnlockedBadges);

public record ReviewAnswerResultDto(
    Guid QuestionId,
    int Quality,
    int NewIntervalDays,
    DateTime NextReviewAt,
    MasteryLevel MasteryLevel);

public record ReviewStatsDto(
    int DueTodayCount,
    int MasteredCount,
    int TotalTrackedQuestions,
    int DailyStreak,
    decimal AverageSuccessRate,
    decimal RetentionRate,
    IReadOnlyList<ReviewTrendPointDto> DailyTrend,
    IReadOnlyList<ReviewMasteryDistributionDto> MasteryDistribution,
    IReadOnlyList<ReviewWeakTopicDto> WeakTopics);

public record ReviewTrendPointDto(
    string Date,
    int ReviewCount,
    decimal SuccessRate);

public record ReviewMasteryDistributionDto(
    MasteryLevel Level,
    int Count);

public record ReviewWeakTopicDto(
    Guid TopicId,
    string TopicTitle,
    string CourseName,
    int DueCount,
    decimal SuccessRate);
