using API.Entities;

namespace API.Services;

public record QuizCompletedEvent(
    string UserId,
    Guid AttemptId,
    Guid? QuizId,
    int TotalQuestions,
    int CorrectAnswers,
    decimal Accuracy,
    DateTime CompletedAt);

public record ReviewCompletedEvent(
    string UserId,
    Guid SessionId,
    int ReviewedQuestionCount,
    decimal Accuracy,
    DateTime CompletedAt);

public record AdaptiveStudyTaskCompletedEvent(
    string UserId,
    Guid TaskId,
    AdaptiveStudyTaskType TaskType,
    Guid? TopicId,
    int ActualMinutes,
    int ActualQuestions,
    DateTime CompletedAt);

public record DailyGoalCompletedEvent(
    string UserId,
    Guid UserDailyGoalId,
    DailyGoalType GoalType,
    int XpReward,
    DateTime CompletedAt);

public record StreakUpdatedEvent(
    string UserId,
    int CurrentStreak,
    DateTime OccurredAt);
