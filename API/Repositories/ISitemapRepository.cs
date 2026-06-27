using API.Dtos;

namespace API.Repositories;

public interface ISitemapRepository
{
    Task<IReadOnlyList<SitemapEntryDto>> GetDynamicEntriesAsync(CancellationToken cancellationToken = default);

    Task<SeoMetadataDto?> GetSeoMetadataAsync(string slug, string baseUrl, string defaultImageUrl, CancellationToken cancellationToken = default);
}
