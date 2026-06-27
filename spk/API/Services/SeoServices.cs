using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using API.Configuration;
using API.Dtos;
using API.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface ISeoCache
{
    void Invalidate();
}

public interface ISitemapService : ISeoCache
{
    Task<string> GenerateSitemapAsync(CancellationToken cancellationToken = default);

    Task<SeoMetadataDto?> GetMetadataAsync(string slug, CancellationToken cancellationToken = default);
}

public interface IRobotsService
{
    string GenerateRobotsTxt();
}

public class SitemapService(
    ISitemapRepository repository,
    IMemoryCache memoryCache,
    IOptions<SeoOptions> options) : ISitemapService
{
    private const string SitemapCacheKey = "seo:sitemap:v1";
    private static readonly Regex SafeSlugPattern = new("^[a-zA-Z0-9-]+$", RegexOptions.Compiled);

    public async Task<string> GenerateSitemapAsync(CancellationToken cancellationToken = default)
    {
        var seoOptions = options.Value;
        var cacheMinutes = Math.Clamp(seoOptions.SitemapCacheMinutes, 5, 1440);

        return await memoryCache.GetOrCreateAsync(
            SitemapCacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(cacheMinutes);
                entry.SlidingExpiration = TimeSpan.FromMinutes(Math.Min(cacheMinutes, 10));

                var entries = StaticEntries()
                    .Concat(await repository.GetDynamicEntriesAsync(cancellationToken))
                    .Where(IsAllowedPath)
                    .Where(x => IsSafePath(x.Path))
                    .GroupBy(x => x.Path.Trim().ToLowerInvariant())
                    .Select(x => x.OrderByDescending(entry => entry.LastModified).First())
                    .OrderByDescending(x => x.Priority)
                    .ThenBy(x => x.Path)
                    .ToList();

                return BuildXml(entries, NormalizeBaseUrl(seoOptions.PublicBaseUrl));
            }) ?? string.Empty;
    }

    public Task<SeoMetadataDto?> GetMetadataAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (!SafeSlugPattern.IsMatch(slug.Trim()))
        {
            return Task.FromResult<SeoMetadataDto?>(null);
        }

        var seoOptions = options.Value;
        return repository.GetSeoMetadataAsync(
            slug,
            NormalizeBaseUrl(seoOptions.PublicBaseUrl),
            seoOptions.DefaultImageUrl,
            cancellationToken);
    }

    public void Invalidate() => memoryCache.Remove(SitemapCacheKey);

    private static IReadOnlyList<SitemapEntryDto> StaticEntries()
    {
        var now = DateTime.UtcNow.Date;
        return
        [
            new("/", now, "daily", 1.0m),
            new("/plans", now, "weekly", 0.9m),
            new("/contact", now, "monthly", 0.6m),
            new("/about", now, "monthly", 0.6m),
            new("/privacy", now, "yearly", 0.3m),
            new("/terms", now, "yearly", 0.3m)
        ];
    }

    private static string BuildXml(IReadOnlyList<SitemapEntryDto> entries, string baseUrl)
    {
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var document = new XDocument(
            new XDeclaration("1.0", "utf-8", null),
            new XElement(ns + "urlset",
                entries.Select(entry =>
                    new XElement(ns + "url",
                        new XElement(ns + "loc", CombineUrl(baseUrl, entry.Path)),
                        new XElement(ns + "lastmod", entry.LastModified.ToUniversalTime().ToString("yyyy-MM-dd")),
                        new XElement(ns + "changefreq", entry.ChangeFrequency),
                        new XElement(ns + "priority", entry.Priority.ToString("0.0", System.Globalization.CultureInfo.InvariantCulture))))));

        return document.ToString(SaveOptions.DisableFormatting);
    }

    private static bool IsAllowedPath(SitemapEntryDto entry)
    {
        var path = entry.Path.Trim().ToLowerInvariant();
        return !path.StartsWith("/admin/") &&
               !path.StartsWith("/dashboard/") &&
               !path.StartsWith("/auth/") &&
               !path.StartsWith("/quiz/") &&
               !path.StartsWith("/api/");
    }

    private static bool IsSafePath(string path)
    {
        if (!path.StartsWith('/') || path.Contains("//") || path.Contains('\\') || path.Contains(".."))
        {
            return false;
        }

        return Uri.TryCreate(path, UriKind.Relative, out _);
    }

    private static string NormalizeBaseUrl(string baseUrl)
    {
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return "https://spkakademi.com";
        }

        return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }

    private static string CombineUrl(string baseUrl, string path) =>
        $"{baseUrl.TrimEnd('/')}{path}";
}

public class RobotsService(IOptions<SeoOptions> options) : IRobotsService
{
    public string GenerateRobotsTxt()
    {
        var baseUrl = NormalizeBaseUrl(options.Value.PublicBaseUrl);
        var builder = new StringBuilder();
        builder.AppendLine("User-agent: *");
        builder.AppendLine();
        builder.AppendLine("Allow: /");
        builder.AppendLine();
        builder.AppendLine("Disallow: /admin/");
        builder.AppendLine("Disallow: /api/");
        builder.AppendLine("Disallow: /dashboard/");
        builder.AppendLine("Disallow: /auth/");
        builder.AppendLine("Disallow: /quiz/");
        builder.AppendLine();
        builder.AppendLine($"Sitemap: {baseUrl}/sitemap.xml");
        return builder.ToString();
    }

    private static string NormalizeBaseUrl(string baseUrl)
    {
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return "https://spkakademi.com";
        }

        return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }
}
