using API.Data;
using API.Services;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class StudentLicenseRepository(DataContext context) : IStudentLicenseRepository
{
    public async Task<bool> HasActiveLicenseAccessAsync(
        string userId,
        Guid licenseId,
        CancellationToken cancellationToken = default)
    {
        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.LicenseId == licenseId)
            .ToListAsync(cancellationToken);

        return accesses.Any(x => UserLicenseAccessRules.IsCurrentlyActive(x));
    }

    public async Task<IReadOnlyList<Guid>> GetActiveLicenseIdsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);

        return accesses
            .Where(x => UserLicenseAccessRules.IsCurrentlyActive(x))
            .Select(x => x.LicenseId)
            .ToList();
    }
}
