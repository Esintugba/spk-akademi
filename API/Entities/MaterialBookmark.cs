namespace API.Entities;

public class MaterialBookmark : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid MaterialId { get; set; }

    public SourceDocument? Material { get; set; }

    public int PageNumber { get; set; }

    public string Title { get; set; } = string.Empty;
}

