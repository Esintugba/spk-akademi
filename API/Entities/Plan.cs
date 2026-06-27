namespace API.Entities;

public class Plan : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ShortDescription { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<PlanLicense> PlanLicenses { get; set; } = new List<PlanLicense>();
}
