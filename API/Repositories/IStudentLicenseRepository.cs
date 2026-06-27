namespace API.Repositories;

public interface IStudentLicenseRepository
{
    Task<bool> HasActiveLicenseAccessAsync(
        string userId,
        Guid licenseId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> GetActiveLicenseIdsAsync(
        string userId,
        CancellationToken cancellationToken = default);
}
