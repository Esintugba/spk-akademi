namespace API.Entities;

public class BlogPost : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public string? CoverImageUrl { get; set; }

    public string? AuthorId { get; set; }

    public AppUser? Author { get; set; }

    public Guid? CategoryId { get; set; }

    public BlogCategory? Category { get; set; }

    public BlogPostStatus Status { get; set; } = BlogPostStatus.Draft;

    public DateTime? PublishedAt { get; set; }

    public string? MetaTitle { get; set; }

    public string? MetaDescription { get; set; }

    public string? CanonicalUrl { get; set; }

    public int ReadingTime { get; set; }

    public int ViewCount { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public ICollection<BlogPostTag> PostTags { get; set; } = new List<BlogPostTag>();
}
