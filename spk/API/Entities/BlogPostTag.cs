namespace API.Entities;

public class BlogPostTag
{
    public Guid BlogPostId { get; set; }

    public BlogPost? BlogPost { get; set; }

    public Guid TagId { get; set; }

    public BlogTag? Tag { get; set; }
}
