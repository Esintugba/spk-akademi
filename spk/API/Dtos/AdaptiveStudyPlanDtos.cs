using API.Entities;

namespace API.Dtos;

public record AdaptiveStudyPlanDto(
    Guid Id,
    DateOnly PlanDate,
    int EstimatedMinutes,
    decimal CompletionRate,
    DateTime GeneratedAt,
    int DaysUntilExam,
    decimal EstimatedTargetCompletionRate,
    string Summary,
    IReadOnlyList<AdaptiveStudyTaskDto> Tasks,
    IReadOnlyList<AdaptiveStudyRecommendationDto> Recommendations,
    IReadOnlyList<AdaptiveStudyRiskTopicDto> RiskyTopics,
    IReadOnlyList<string> CriticalWeeklyTasks);

public record AdaptiveStudyTaskDto(
    Guid Id,
    AdaptiveStudyTaskType Type,
    Guid? TopicId,
    string? TopicTitle,
    Guid? MainTopicId,
    string? MainTopicTitle,
    string? CourseName,
    int TargetMinutes,
    int TargetQuestions,
    decimal Priority,
    string ActionUrl,
    string Title,
    string Description,
    bool Completed,
    DateTime? CompletedAt,
    int ActualMinutes,
    int ActualQuestions);

public record CompleteAdaptiveStudyTaskDto(
    int? ActualMinutes,
    int? ActualQuestions);

public record AdaptiveStudyRecommendationDto(
    Guid? TopicId,
    string Title,
    string Description,
    decimal Priority,
    string ActionUrl);

public record AdaptiveStudyRiskTopicDto(
    Guid TopicId,
    string TopicTitle,
    Guid? MainTopicId,
    string? MainTopicTitle,
    string CourseName,
    decimal Priority,
    decimal SuccessRate,
    int WrongCount,
    int DueReviewCount);
