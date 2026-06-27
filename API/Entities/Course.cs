namespace API.Entities;

public class Course : BaseEntity
{
    public Guid LicenseId { get; set; }

    public License? License { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int Order { get; set; }

    public ICollection<Topic> Topics { get; set; } = new List<Topic>();

    public ICollection<SourceDocument> SourceDocuments { get; set; } = new List<SourceDocument>();
}
