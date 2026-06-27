namespace API.Entities;

public class UserLicenseAccess : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid LicenseId { get; set; }

    public License? License { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime? EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public AccessSource AccessSource { get; set; } = AccessSource.Admin;

    public bool IsDemoAccess { get; set; }

    public bool GrantedAutomatically { get; set; }

    public DateTime? ExpiresAt { get; set; }
}
