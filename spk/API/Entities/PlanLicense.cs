namespace API.Entities;

public class PlanLicense : BaseEntity
{
    public Guid PlanId { get; set; }

    public Plan? Plan { get; set; }

    public Guid LicenseId { get; set; }

    public License? License { get; set; }
}
