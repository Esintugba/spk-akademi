namespace API.Entities;

public class UserOnboardingState : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public bool HasSeenWelcome { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int CurrentStep { get; set; }
}
