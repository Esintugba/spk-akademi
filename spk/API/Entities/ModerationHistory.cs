namespace API.Entities;

public class ModerationHistory : BaseEntity
{
    public string ContentType { get; set; } = string.Empty;

    public Guid ContentId { get; set; }

    public ReviewStatus FromStatus { get; set; }

    public ReviewStatus ToStatus { get; set; }

    public string? ReviewerId { get; set; }

    public AppUser? Reviewer { get; set; }

    public string? Comment { get; set; }
}
