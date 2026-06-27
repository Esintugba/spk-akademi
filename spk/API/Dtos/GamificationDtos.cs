using API.Entities;

namespace API.Dtos;

public record GamificationProfileDto(
    Guid Id,
    string UserId,
    int Level,
    int Xp,
    int TotalXp,
    int CurrentLevelXpThreshold,
    int NextLevelXpThreshold,
    decimal LevelProgressPercentage,
    int CurrentStreak,
    int LongestStreak,
    bool DailyGoalCompleted,
    DateTime? LastActivityAt,
    int Rank,
    int UnlockedBadgeCount,
    int TotalBadgeCount,
    int CompletedDailyGoalCount);

public record BadgeDto(
    Guid Id,
    string Name,
    string Description,
    string IconUrl,
    int XpReward,
    BadgeCategory Category,
    BadgeRequirementType RequirementType,
    int RequirementValue,
    bool IsHidden);

public record UpsertBadgeDto(
    string Name,
    string Description,
    string IconUrl,
    int XpReward,
    BadgeCategory Category,
    BadgeRequirementType RequirementType,
    int RequirementValue,
    bool IsHidden);

public record UserBadgeDto(
    Guid BadgeId,
    string Name,
    string Description,
    string IconUrl,
    int XpReward,
    BadgeCategory Category,
    BadgeRequirementType RequirementType,
    bool IsHidden,
    bool Unlocked,
    DateTime? UnlockedAt,
    int Progress,
    int RequirementValue);

public record UnlockedBadgeDto(
    Guid BadgeId,
    string Name,
    string Description,
    string IconUrl,
    int XpReward,
    BadgeCategory Category,
    DateTime UnlockedAt);

public record DailyGoalDto(
    Guid UserDailyGoalId,
    Guid DailyGoalId,
    string Title,
    string Description,
    DailyGoalType GoalType,
    int TargetValue,
    int Progress,
    bool Completed,
    DateTime? CompletedAt,
    int XpReward,
    DateOnly ActiveDate);

public record LeaderboardEntryDto(
    int Rank,
    string UserId,
    string DisplayName,
    int Level,
    int TotalXp,
    int CurrentStreak,
    decimal Accuracy,
    int SolvedQuestions,
    decimal MetricValue);

public record XPTransactionDto(
    Guid Id,
    int Amount,
    string Reason,
    string ReferenceType,
    string? ReferenceId,
    DateTime CreatedAt);

public record XpHistoryResponseDto(
    IReadOnlyList<XPTransactionDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public record LeaderboardQueryDto(
    LeaderboardPeriod Period = LeaderboardPeriod.Weekly,
    LeaderboardMetric Metric = LeaderboardMetric.Xp,
    int Top = 20);

public record XpHistoryQueryDto(
    int Page = 1,
    int PageSize = 20);
