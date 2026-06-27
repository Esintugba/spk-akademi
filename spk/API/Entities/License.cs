namespace API.Entities;

public class License : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ShortDescription { get; set; }

    public string? IconUrl { get; set; }

    public int DisplayOrder { get; set; }

    public int EstimatedStudyHours { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
