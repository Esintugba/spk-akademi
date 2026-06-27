namespace API.Entities;

public class UserGamificationProfile : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public int Level { get; set; } = 1;

    public int XP { get; set; }

    public int TotalXP { get; set; }

    public int CurrentStreak { get; set; }

    public int LongestStreak { get; set; }

    public bool DailyGoalCompleted { get; set; }

    public DateTime? LastActivityAt { get; set; }

    public int Rank { get; set; }

}
