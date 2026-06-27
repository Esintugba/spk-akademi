using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class SitemapRepository(DataContext context) : ISitemapRepository
{
    public async Task<IReadOnlyList<SitemapEntryDto>> GetDynamicEntriesAsync(CancellationToken cancellationToken = default)
    {
        var licenses = await context.Licenses
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => new SitemapEntryDto(
                $"/licenses/{x.Slug}",
                x.UpdatedAt ?? x.CreatedAt,
                "weekly",
                0.9m))
            .ToListAsync(cancellationToken);

        var courses = await context.Courses
            .AsNoTracking()
            .Where(x => x.License != null && x.License.IsActive)
            .Select(x => new SitemapEntryDto(
                $"/courses/{x.Slug}",
                x.UpdatedAt ?? x.CreatedAt,
                "weekly",
                0.75m))
            .ToListAsync(cancellationToken);

        var topics = await context.Topics
            .AsNoTracking()
            .Where(x => x.Course != null && x.Course.License != null && x.Course.License.IsActive)
            .Select(x => new SitemapEntryDto(
                $"/topics/{x.Slug}",
                x.UpdatedAt ?? x.CreatedAt,
                "weekly",
                0.65m))
            .ToListAsync(cancellationToken);

        var blogPosts = await context.BlogPosts
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.Status == BlogPostStatus.Published && x.PublishedAt <= DateTime.UtcNow)
            .Select(x => new SitemapEntryDto(
                $"/blog/{x.Slug}",
                x.UpdatedAt ?? x.PublishedAt ?? x.CreatedAt,
                "weekly",
                0.8m))
            .ToListAsync(cancellationToken);

        return licenses.Concat(courses).Concat(topics).Concat(blogPosts).ToList();
    }

    public async Task<SeoMetadataDto?> GetSeoMetadataAsync(
        string slug,
        string baseUrl,
        string defaultImageUrl,
        CancellationToken cancellationToken = default)
    {
        var normalizedSlug = slug.Trim();

        var license = await context.Licenses
            .AsNoTracking()
            .Where(x => x.IsActive && x.Slug == normalizedSlug)
            .Select(x => new SeoMetadataDto(
                x.Slug,
                $"/licenses/{x.Slug}",
                x.Name,
                x.ShortDescription ?? x.Description ?? $"{x.Name} lisans hazırlık müfredatı.",
                CombineUrl(baseUrl, $"/licenses/{x.Slug}"),
                "website",
                ResolveImage(baseUrl, x.IconUrl, defaultImageUrl)))
            .FirstOrDefaultAsync(cancellationToken);

        if (license is not null)
        {
            return license;
        }

        var course = await context.Courses
            .AsNoTracking()
            .Where(x => x.Slug == normalizedSlug && x.License != null && x.License.IsActive)
            .Select(x => new SeoMetadataDto(
                x.Slug,
                $"/courses/{x.Slug}",
                x.Name,
                x.Description ?? $"{x.Name} dersi konu ve soru kapsamı.",
                CombineUrl(baseUrl, $"/courses/{x.Slug}"),
                "article",
                ResolveImage(baseUrl, null, defaultImageUrl)))
            .FirstOrDefaultAsync(cancellationToken);

        if (course is not null)
        {
            return course;
        }

        var topic = await context.Topics
            .AsNoTracking()
            .Where(x => x.Slug == normalizedSlug && x.Course != null && x.Course.License != null && x.Course.License.IsActive)
            .Select(x => new SeoMetadataDto(
                x.Slug,
                $"/topics/{x.Slug}",
                x.Title,
                x.Summary ?? $"{x.Title} konu özeti ve çalışma kapsamı.",
                CombineUrl(baseUrl, $"/topics/{x.Slug}"),
                "article",
                ResolveImage(baseUrl, null, defaultImageUrl)))
            .FirstOrDefaultAsync(cancellationToken);

        if (topic is not null)
        {
            return topic;
        }

        return await context.BlogPosts
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.Status == BlogPostStatus.Published && x.PublishedAt <= DateTime.UtcNow && x.Slug == normalizedSlug)
            .Select(x => new SeoMetadataDto(
                x.Slug,
                $"/blog/{x.Slug}",
                x.MetaTitle ?? x.Title,
                x.MetaDescription ?? x.Summary,
                string.IsNullOrWhiteSpace(x.CanonicalUrl) ? CombineUrl(baseUrl, $"/blog/{x.Slug}") : x.CanonicalUrl,
                "article",
                ResolveImage(baseUrl, x.CoverImageUrl, defaultImageUrl)))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static string ResolveImage(string baseUrl, string? imageUrl, string defaultImageUrl) =>
        CombineUrl(baseUrl, string.IsNullOrWhiteSpace(imageUrl) ? defaultImageUrl : imageUrl);

    private static string CombineUrl(string baseUrl, string path)
    {
        var safePath = path.StartsWith('/') ? path : $"/{path}";
        return $"{baseUrl.TrimEnd('/')}{safePath}";
    }
}
