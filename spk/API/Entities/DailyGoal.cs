namespace API.Entities;

public class DailyGoal : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DailyGoalType GoalType { get; set; }

    public int TargetValue { get; set; }

    public int XPReward { get; set; }

    public DateOnly ActiveDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public ICollection<UserDailyGoal> UserGoals { get; set; } = new List<UserDailyGoal>();
}
