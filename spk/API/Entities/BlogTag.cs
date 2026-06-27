namespace API.Entities;

public class BlogTag : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public ICollection<BlogPostTag> PostTags { get; set; } = new List<BlogPostTag>();
}
