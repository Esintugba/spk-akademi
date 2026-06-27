namespace API.Configuration;

public class SeoOptions
{
    public const string SectionName = "Seo";

    public string PublicBaseUrl { get; set; } = "https://spkakademi.com";

    public string DefaultImageUrl { get; set; } = "/social-preview.svg";

    public int SitemapCacheMinutes { get; set; } = 30;
}
