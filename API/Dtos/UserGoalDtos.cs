using API.Entities;

namespace API.Dtos;

public record UserGoalDto(
    Guid Id,
    string Title,
    string? Description,
    UserGoalType GoalType,
    int TargetValue,
    int CurrentValue,
    decimal ProgressPercentage,
    DateTime StartDate,
    DateTime TargetDate,
    int DaysRemaining,
    UserGoalStatus Status,
    bool IsOverdue,
    DateTime? CompletedAt,
    DateTime CreatedAt);

public record CreateUserGoalDto(
    string Title,
    string? Description,
    UserGoalType GoalType,
    int TargetValue,
    DateTime StartDate,
    DateTime TargetDate);

public record UpdateUserGoalDto(
    string Title,
    string? Description,
    int TargetValue,
    DateTime StartDate,
    DateTime TargetDate,
    UserGoalStatus Status);
