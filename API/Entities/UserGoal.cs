namespace API.Entities;

public class UserGoal : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public UserGoalType GoalType { get; set; }

    public int TargetValue { get; set; }

    public int CurrentValue { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime TargetDate { get; set; } = DateTime.UtcNow.AddDays(30);

    public UserGoalStatus Status { get; set; } = UserGoalStatus.Active;

    public DateTime? CompletedAt { get; set; }
}
