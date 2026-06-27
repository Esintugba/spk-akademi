using API.Dtos;
using API.Repositories;
using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public interface ILicenseCatalogCache
{
    void Invalidate();
}

public interface ILicenseCatalogService : ILicenseCatalogCache
{
    Task<IReadOnlyList<LicenseCatalogDto>> GetCatalogAsync(
        string? userId,
        CancellationToken cancellationToken = default);

    Task<LicenseCatalogDto?> GetBySlugAsync(
        string slug,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<LicenseCatalogDto?> GetByIdAsync(
        Guid id,
        string? userId,
        CancellationToken cancellationToken = default);
}

public class LicenseCatalogService(
    ILicenseCatalogRepository repository,
    IUserLicenseAccessRepository userLicenseAccessRepository,
    IMemoryCache memoryCache) : ILicenseCatalogService
{
    private const string CatalogCacheKey = "license-catalog:active:v1";
    private static readonly MemoryCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
        SlidingExpiration = TimeSpan.FromMinutes(2)
    };

    public async Task<IReadOnlyList<LicenseCatalogDto>> GetCatalogAsync(
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var catalog = await memoryCache.GetOrCreateAsync(
            CatalogCacheKey,
            async entry =>
            {
                entry.SetOptions(CacheOptions);
                return await repository.GetActiveCatalogAsync(cancellationToken);
            }) ?? [];

        return await AttachAccessAsync(catalog, userId, cancellationToken);
    }

    public async Task<LicenseCatalogDto?> GetBySlugAsync(
        string slug,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var catalog = await GetCatalogAsync(userId, cancellationToken);
        return catalog.FirstOrDefault(x => string.Equals(x.Slug, slug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<LicenseCatalogDto?> GetByIdAsync(
        Guid id,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var catalog = await GetCatalogAsync(userId, cancellationToken);
        return catalog.FirstOrDefault(x => x.Id == id);
    }

    public void Invalidate() => memoryCache.Remove(CatalogCacheKey);

    private async Task<IReadOnlyList<LicenseCatalogDto>> AttachAccessAsync(
        IReadOnlyList<LicenseCatalogDto> catalog,
        string? userId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return catalog;
        }

        var accesses = await userLicenseAccessRepository.GetUserAccessesAsync(userId, cancellationToken);
        var activeLicenseIds = accesses
            .Where(access => UserLicenseAccessRules.IsCurrentlyActive(access))
            .Select(x => x.LicenseId)
            .ToHashSet();

        return catalog.Select(license => license with
        {
            HasAccess = activeLicenseIds.Contains(license.Id)
        }).ToList();
    }
}
