namespace API.Entities;

public class UserDailyGoal : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid DailyGoalId { get; set; }

    public DailyGoal? DailyGoal { get; set; }

    public int Progress { get; set; }

    public bool Completed { get; set; }

    public DateTime? CompletedAt { get; set; }
}
