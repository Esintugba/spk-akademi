namespace API.Dtos;

public record SitemapEntryDto(
    string Path,
    DateTime LastModified,
    string ChangeFrequency,
    decimal Priority);

public record SeoMetadataDto(
    string Slug,
    string Path,
    string Title,
    string Description,
    string CanonicalUrl,
    string OpenGraphType,
    string ImageUrl);
