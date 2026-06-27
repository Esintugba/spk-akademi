using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class BlogRepository(DataContext context) : IBlogRepository
{
    public IQueryable<BlogPost> QueryPosts(bool includeUnpublished = false)
    {
        var query = context.BlogPosts
            .Include(x => x.Author)
            .Include(x => x.Category)
            .Include(x => x.PostTags)
                .ThenInclude(x => x.Tag)
            .Where(x => !x.IsDeleted);

        if (!includeUnpublished)
        {
            query = query.Where(x => x.Status == BlogPostStatus.Published && x.PublishedAt <= DateTime.UtcNow);
        }

        return query;
    }

    public Task<BlogPost?> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        QueryPosts(includeUnpublished: true).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<BlogPost?> GetPublishedPostBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        QueryPosts().FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, Guid? exceptId = null, CancellationToken cancellationToken = default) =>
        context.BlogPosts
            .AsNoTracking()
            .AnyAsync(x => !x.IsDeleted && x.Slug == slug && (!exceptId.HasValue || x.Id != exceptId.Value), cancellationToken);

    public async Task<(IReadOnlyList<BlogPost> Items, int TotalCount)> GetPostsAsync(
        BlogQueryDto query,
        bool includeUnpublished,
        CancellationToken cancellationToken = default)
    {
        var posts = QueryPosts(includeUnpublished);

        if (!string.IsNullOrWhiteSpace(query.CategorySlug))
        {
            var categorySlug = query.CategorySlug.Trim();
            posts = posts.Where(x => x.Category != null && x.Category.Slug == categorySlug);
        }

        if (!string.IsNullOrWhiteSpace(query.TagSlug))
        {
            var tagSlug = query.TagSlug.Trim();
            posts = posts.Where(x => x.PostTags.Any(tag => tag.Tag != null && tag.Tag.Slug == tagSlug));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            posts = posts.Where(x =>
                x.Title.Contains(search) ||
                x.Summary.Contains(search) ||
                x.Content.Contains(search) ||
                x.PostTags.Any(tag => tag.Tag != null && tag.Tag.Name.Contains(search)));
        }

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 48);
        var total = await posts.CountAsync(cancellationToken);
        var items = await posts
            .OrderByDescending(x => x.PublishedAt ?? x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<BlogCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
        await context.BlogCategories
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new BlogCategoryDto(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.DisplayOrder,
                x.Posts.Count(post => !post.IsDeleted && post.Status == BlogPostStatus.Published && post.PublishedAt <= DateTime.UtcNow)))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BlogTagDto>> GetTagsAsync(CancellationToken cancellationToken = default) =>
        await context.BlogTags
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new BlogTagDto(
                x.Id,
                x.Name,
                x.Slug,
                x.PostTags.Count(postTag =>
                    postTag.BlogPost != null &&
                    !postTag.BlogPost.IsDeleted &&
                    postTag.BlogPost.Status == BlogPostStatus.Published &&
                    postTag.BlogPost.PublishedAt <= DateTime.UtcNow)))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BlogPost>> GetRelatedPostsAsync(
        BlogPost post,
        int take,
        CancellationToken cancellationToken = default)
    {
        var tagIds = post.PostTags.Select(x => x.TagId).ToList();
        return await QueryPosts()
            .AsNoTracking()
            .Where(x => x.Id != post.Id && (x.CategoryId == post.CategoryId || x.PostTags.Any(tag => tagIds.Contains(tag.TagId))))
            .OrderByDescending(x => x.PostTags.Count(tag => tagIds.Contains(tag.TagId)))
            .ThenByDescending(x => x.PublishedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<BlogCategory?> GetCategoryAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.BlogCategories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<BlogTag>> GetOrCreateTagsAsync(
        IReadOnlyList<string> tagNames,
        CancellationToken cancellationToken = default)
    {
        var names = tagNames
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(12)
            .ToList();

        var slugs = names.Select(Slugify).ToList();
        var existing = await context.BlogTags
            .Where(x => slugs.Contains(x.Slug))
            .ToListAsync(cancellationToken);

        foreach (var name in names)
        {
            var slug = Slugify(name);
            if (existing.Any(x => x.Slug == slug))
            {
                continue;
            }

            var tag = new BlogTag { Name = name, Slug = slug };
            context.BlogTags.Add(tag);
            existing.Add(tag);
        }

        return existing;
    }

    public async Task AddPostAsync(BlogPost post, CancellationToken cancellationToken = default) =>
        await context.BlogPosts.AddAsync(post, cancellationToken);

    public void RemovePostTags(BlogPost post) => context.BlogPostTags.RemoveRange(post.PostTags);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);

    private static string Slugify(string value)
    {
        var normalized = value.Trim().ToLowerInvariant()
            .Replace("ı", "i").Replace("ğ", "g").Replace("ü", "u")
            .Replace("ş", "s").Replace("ö", "o").Replace("ç", "c");
        var chars = normalized.Select(ch => char.IsLetterOrDigit(ch) ? ch : '-').ToArray();
        return string.Join('-', new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries));
    }
}
