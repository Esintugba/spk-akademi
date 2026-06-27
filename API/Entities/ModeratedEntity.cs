namespace API.Entities;

public abstract class ModeratedEntity : BaseEntity
{
    public ReviewStatus ReviewStatus { get; set; } = ReviewStatus.Draft;

    public string? ReviewedById { get; set; }

    public AppUser? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? ReviewComment { get; set; }

    public ContentAccessLevel AccessLevel { get; set; } = ContentAccessLevel.Free;

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }
}
