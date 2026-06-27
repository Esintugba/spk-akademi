namespace API.Entities;

public class UserBadge : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid BadgeId { get; set; }

    public Badge? Badge { get; set; }

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;

    public int Progress { get; set; }
}
