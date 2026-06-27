using API.Dtos;

namespace API.Repositories;

public interface ILicenseCatalogRepository
{
    Task<IReadOnlyList<LicenseCatalogDto>> GetActiveCatalogAsync(CancellationToken cancellationToken = default);

    Task<LicenseCatalogDto?> GetActiveCatalogBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<LicenseCatalogDto?> GetActiveCatalogByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
