namespace API.Entities;

public class Badge : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string IconUrl { get; set; } = string.Empty;

    public int XPReward { get; set; }

    public BadgeCategory Category { get; set; }

    public BadgeRequirementType RequirementType { get; set; }

    public int RequirementValue { get; set; }

    public bool IsHidden { get; set; }

    public ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
}
