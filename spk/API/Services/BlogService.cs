using System.Text.RegularExpressions;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public interface IBlogService
{
    Task<BlogListResponseDto> GetPostsAsync(BlogQueryDto query, bool includeUnpublished = false, CancellationToken cancellationToken = default);

    Task<BlogPostDetailDto?> GetPostAsync(string slug, CancellationToken cancellationToken = default);

    Task<BlogPostDetailDto?> GetAdminPostAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BlogCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BlogTagDto>> GetTagsAsync(CancellationToken cancellationToken = default);

    Task<BlogPostDetailDto?> CreatePostAsync(string authorId, UpsertBlogPostDto dto, CancellationToken cancellationToken = default);

    Task<BlogPostDetailDto?> UpdatePostAsync(Guid id, UpsertBlogPostDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeletePostAsync(Guid id, CancellationToken cancellationToken = default);

    void Invalidate();
}

public class BlogService(
    IBlogRepository repository,
    IMemoryCache memoryCache,
    ISeoCache seoCache) : IBlogService
{
    private const string CategoriesCacheKey = "blog:categories:v1";
    private const string TagsCacheKey = "blog:tags:v1";
    private static readonly Regex HtmlTagPattern = new("<.*?>", RegexOptions.Compiled);

    public async Task<BlogListResponseDto> GetPostsAsync(
        BlogQueryDto query,
        bool includeUnpublished = false,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await repository.GetPostsAsync(query, includeUnpublished, cancellationToken);
        return new BlogListResponseDto(
            items.Select(ToListItem).ToList(),
            total,
            Math.Max(1, query.Page),
            Math.Clamp(query.PageSize, 1, 48));
    }

    public async Task<BlogPostDetailDto?> GetPostAsync(string slug, CancellationToken cancellationToken = default)
    {
        var post = await repository.GetPublishedPostBySlugAsync(slug.Trim(), cancellationToken);
        if (post is null)
        {
            return null;
        }

        post.ViewCount += 1;
        await repository.SaveChangesAsync(cancellationToken);

        var related = await repository.GetRelatedPostsAsync(post, 4, cancellationToken);
        return ToDetail(post, related);
    }

    public async Task<BlogPostDetailDto?> GetAdminPostAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var post = await repository.GetPostByIdAsync(id, cancellationToken);
        return post is null ? null : ToDetail(post, []);
    }

    public async Task<IReadOnlyList<BlogCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
        await memoryCache.GetOrCreateAsync(CategoriesCacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            return repository.GetCategoriesAsync(cancellationToken);
        }) ?? [];

    public async Task<IReadOnlyList<BlogTagDto>> GetTagsAsync(CancellationToken cancellationToken = default) =>
        await memoryCache.GetOrCreateAsync(TagsCacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            return repository.GetTagsAsync(cancellationToken);
        }) ?? [];

    public async Task<BlogPostDetailDto?> CreatePostAsync(
        string authorId,
        UpsertBlogPostDto dto,
        CancellationToken cancellationToken = default)
    {
        var slug = await EnsureUniqueSlugAsync(dto.Slug, dto.Title, null, cancellationToken);
        var status = dto.Status;
        var sanitizedContent = BlogHtmlSanitizer.Sanitize(dto.Content);
        var post = new BlogPost
        {
            Title = dto.Title.Trim(),
            Slug = slug,
            Summary = dto.Summary.Trim(),
            Content = sanitizedContent,
            CoverImageUrl = NormalizeNullable(dto.CoverImageUrl),
            AuthorId = authorId,
            CategoryId = dto.CategoryId,
            Status = status,
            PublishedAt = status == BlogPostStatus.Published ? dto.PublishedAt ?? DateTime.UtcNow : dto.PublishedAt,
            MetaTitle = NormalizeNullable(dto.MetaTitle) ?? dto.Title.Trim(),
            MetaDescription = NormalizeNullable(dto.MetaDescription) ?? dto.Summary.Trim(),
            CanonicalUrl = NormalizeNullable(dto.CanonicalUrl),
            ReadingTime = CalculateReadingTime(sanitizedContent)
        };

        await AttachTagsAsync(post, dto.Tags, cancellationToken);
        await repository.AddPostAsync(post, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        Invalidate();

        return ToDetail(post, []);
    }

    public async Task<BlogPostDetailDto?> UpdatePostAsync(Guid id, UpsertBlogPostDto dto, CancellationToken cancellationToken = default)
    {
        var post = await repository.GetPostByIdAsync(id, cancellationToken);
        if (post is null)
        {
            return null;
        }

        post.Title = dto.Title.Trim();
        post.Slug = await EnsureUniqueSlugAsync(dto.Slug, dto.Title, id, cancellationToken);
        post.Summary = dto.Summary.Trim();
        var sanitizedContent = BlogHtmlSanitizer.Sanitize(dto.Content);
        post.Content = sanitizedContent;
        post.CoverImageUrl = NormalizeNullable(dto.CoverImageUrl);
        post.CategoryId = dto.CategoryId;
        post.Status = dto.Status;
        post.PublishedAt = dto.Status == BlogPostStatus.Published
            ? dto.PublishedAt ?? post.PublishedAt ?? DateTime.UtcNow
            : dto.PublishedAt;
        post.MetaTitle = NormalizeNullable(dto.MetaTitle) ?? post.Title;
        post.MetaDescription = NormalizeNullable(dto.MetaDescription) ?? post.Summary;
        post.CanonicalUrl = NormalizeNullable(dto.CanonicalUrl);
        post.ReadingTime = CalculateReadingTime(sanitizedContent);
        post.UpdatedAt = DateTime.UtcNow;

        repository.RemovePostTags(post);
        await AttachTagsAsync(post, dto.Tags, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        Invalidate();

        return ToDetail(post, []);
    }

    public async Task<bool> DeletePostAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var post = await repository.GetPostByIdAsync(id, cancellationToken);
        if (post is null)
        {
            return false;
        }

        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;
        await repository.SaveChangesAsync(cancellationToken);
        Invalidate();
        return true;
    }

    public void Invalidate()
    {
        memoryCache.Remove(CategoriesCacheKey);
        memoryCache.Remove(TagsCacheKey);
        seoCache.Invalidate();
    }

    private async Task AttachTagsAsync(BlogPost post, IReadOnlyList<string>? tags, CancellationToken cancellationToken)
    {
        var tagEntities = await repository.GetOrCreateTagsAsync(tags ?? [], cancellationToken);
        post.PostTags = tagEntities.Select(tag => new BlogPostTag { BlogPost = post, Tag = tag, TagId = tag.Id }).ToList();
    }

    private async Task<string> EnsureUniqueSlugAsync(string? slug, string title, Guid? exceptId, CancellationToken cancellationToken)
    {
        var baseSlug = Slugify(string.IsNullOrWhiteSpace(slug) ? title : slug);
        var candidate = baseSlug;
        var suffix = 2;
        while (await repository.SlugExistsAsync(candidate, exceptId, cancellationToken))
        {
            candidate = $"{baseSlug}-{suffix++}";
        }

        return candidate;
    }

    private static BlogPostListItemDto ToListItem(BlogPost post) =>
        new(
            post.Id,
            post.Title,
            post.Slug,
            post.Summary,
            post.CoverImageUrl,
            post.Category is null ? null : new BlogCategoryDto(post.Category.Id, post.Category.Name, post.Category.Slug, post.Category.Description, post.Category.DisplayOrder, 0),
            post.Author?.DisplayName ?? post.Author?.Email,
            post.Status,
            post.PublishedAt,
            post.ReadingTime,
            post.ViewCount,
            post.PostTags
                .Where(x => x.Tag is not null)
                .Select(x => new BlogTagDto(x.Tag!.Id, x.Tag.Name, x.Tag.Slug, 0))
                .ToList());

    private static BlogPostDetailDto ToDetail(BlogPost post, IReadOnlyList<BlogPost> relatedPosts)
    {
        var canonical = string.IsNullOrWhiteSpace(post.CanonicalUrl) ? $"/blog/{post.Slug}" : post.CanonicalUrl;
        return new BlogPostDetailDto(
            post.Id,
            post.Title,
            post.Slug,
            post.Summary,
            BlogHtmlSanitizer.Sanitize(post.Content),
            post.CoverImageUrl,
            post.Category is null ? null : new BlogCategoryDto(post.Category.Id, post.Category.Name, post.Category.Slug, post.Category.Description, post.Category.DisplayOrder, 0),
            post.Author?.DisplayName ?? post.Author?.Email,
            post.Status,
            post.PublishedAt,
            post.CreatedAt,
            post.UpdatedAt,
            post.MetaTitle ?? post.Title,
            post.MetaDescription ?? post.Summary,
            canonical,
            post.ReadingTime,
            post.ViewCount,
            post.PostTags
                .Where(x => x.Tag is not null)
                .Select(x => new BlogTagDto(x.Tag!.Id, x.Tag.Name, x.Tag.Slug, 0))
                .ToList(),
            relatedPosts.Select(ToListItem).ToList());
    }

    private static int CalculateReadingTime(string content)
    {
        var text = HtmlTagPattern.Replace(content, " ");
        var wordCount = text.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Length;
        return Math.Max(1, (int)Math.Ceiling(wordCount / 220m));
    }

    private static string? NormalizeNullable(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string Slugify(string value)
    {
        var normalized = value.Trim().ToLowerInvariant()
            .Replace("ı", "i").Replace("ğ", "g").Replace("ü", "u")
            .Replace("ş", "s").Replace("ö", "o").Replace("ç", "c");
        var chars = normalized.Select(ch => char.IsLetterOrDigit(ch) ? ch : '-').ToArray();
        var slug = string.Join('-', new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(slug) ? Guid.NewGuid().ToString("N")[..12] : slug;
    }
}
