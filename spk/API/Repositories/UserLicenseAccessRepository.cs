using API.Data;
using API.Entities;
using API.Services;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IUserLicenseAccessRepository
{
    Task<UserLicenseAccess?> GetByUserAndLicenseAsync(
        string userId,
        Guid licenseId,
        CancellationToken cancellationToken = default);

    Task<UserLicenseAccess?> GetActiveDemoAccessAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveDemoAccessAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveFullAccessAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserLicenseAccess>> GetUserAccessesAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<License>> GetLicensesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserLicenseAccess>> GetAllWithUserAndLicenseAsync(
        CancellationToken cancellationToken = default);

    Task<UserLicenseAccess?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<UserLicenseAccess?> GetByIdWithUserAndLicenseAsync(Guid id, CancellationToken cancellationToken = default);

    Task<License?> GetLicenseAsync(Guid licenseId, CancellationToken cancellationToken = default);

    Task<int> DeactivateExpiredForUserAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task GrantOrActivateAsync(
        string userId,
        Guid licenseId,
        AccessSource source,
        CancellationToken cancellationToken = default);

    Task GrantDemoAccessAsync(
        string userId,
        Guid licenseId,
        DateTime expiresAt,
        CancellationToken cancellationToken = default);

    Task AddAsync(UserLicenseAccess access, CancellationToken cancellationToken = default);

    void Remove(UserLicenseAccess access);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class UserLicenseAccessRepository(DataContext context) : IUserLicenseAccessRepository
{
    public Task<UserLicenseAccess?> GetByUserAndLicenseAsync(
        string userId,
        Guid licenseId,
        CancellationToken cancellationToken = default) =>
        context.UserLicenseAccesses
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LicenseId == licenseId, cancellationToken);

    public async Task<UserLicenseAccess?> GetActiveDemoAccessAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Include(x => x.License)
            .Where(x => x.UserId == userId && x.IsDemoAccess)
            .ToListAsync(cancellationToken);

        return accesses.FirstOrDefault(x => UserLicenseAccessRules.IsCurrentlyActive(x));
    }

    public async Task<bool> HasActiveDemoAccessAsync(
        string userId,
        CancellationToken cancellationToken = default) =>
        await GetActiveDemoAccessAsync(userId, cancellationToken) is not null;

    public async Task<bool> HasActiveFullAccessAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.IsDemoAccess)
            .ToListAsync(cancellationToken);

        return accesses.Any(x => UserLicenseAccessRules.IsCurrentlyActive(x));
    }

    public async Task<IReadOnlyList<UserLicenseAccess>> GetUserAccessesAsync(
        string userId,
        CancellationToken cancellationToken = default) =>
        await context.UserLicenseAccesses
            .AsNoTracking()
            .Include(x => x.License)
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<License>> GetLicensesAsync(CancellationToken cancellationToken = default) =>
        await context.Licenses
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<UserLicenseAccess>> GetAllWithUserAndLicenseAsync(
        CancellationToken cancellationToken = default) =>
        await context.UserLicenseAccesses
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.License)
            .OrderBy(x => x.User!.Email)
            .ThenBy(x => x.License!.Name)
            .ToListAsync(cancellationToken);

    public Task<UserLicenseAccess?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.UserLicenseAccesses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<UserLicenseAccess?> GetByIdWithUserAndLicenseAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        context.UserLicenseAccesses
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.License)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<License?> GetLicenseAsync(Guid licenseId, CancellationToken cancellationToken = default) =>
        context.Licenses.FirstOrDefaultAsync(x => x.Id == licenseId, cancellationToken);

    public async Task<int> DeactivateExpiredForUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var accesses = await context.UserLicenseAccesses
            .Where(x => x.UserId == userId && x.IsActive)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var changed = 0;

        foreach (var access in accesses.Where(x => UserLicenseAccessRules.IsExpired(x, now)))
        {
            access.IsActive = false;
            access.UpdatedAt = now;
            changed++;
        }

        if (changed > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return changed;
    }

    public async Task GrantDemoAccessAsync(
        string userId,
        Guid licenseId,
        DateTime expiresAt,
        CancellationToken cancellationToken = default)
    {
        if (expiresAt <= DateTime.UtcNow)
        {
            throw new ArgumentException("Demo süresi geçmiş bir tarih olamaz.", nameof(expiresAt));
        }

        var existing = await context.UserLicenseAccesses
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LicenseId == licenseId, cancellationToken);

        var now = DateTime.UtcNow;

        if (existing is not null)
        {
            if (existing.IsDemoAccess && UserLicenseAccessRules.IsCurrentlyActive(existing, now))
            {
                return;
            }

            existing.IsActive = true;
            existing.IsDemoAccess = true;
            existing.GrantedAutomatically = true;
            existing.AccessSource = AccessSource.Demo;
            existing.StartDate = now;
            existing.EndDate = expiresAt;
            existing.ExpiresAt = expiresAt;
            existing.UpdatedAt = now;
        }
        else
        {
            context.UserLicenseAccesses.Add(new UserLicenseAccess
            {
                UserId = userId,
                LicenseId = licenseId,
                StartDate = now,
                EndDate = expiresAt,
                ExpiresAt = expiresAt,
                IsActive = true,
                IsDemoAccess = true,
                GrantedAutomatically = true,
                AccessSource = AccessSource.Demo
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task GrantOrActivateAsync(
        string userId,
        Guid licenseId,
        AccessSource source,
        CancellationToken cancellationToken = default)
    {
        var existing = await GetByUserAndLicenseAsync(userId, licenseId, cancellationToken);
        var now = DateTime.UtcNow;

        if (existing is null)
        {
            context.UserLicenseAccesses.Add(new UserLicenseAccess
            {
                UserId = userId,
                LicenseId = licenseId,
                StartDate = now,
                IsActive = true,
                AccessSource = source
            });
        }
        else
        {
            existing.IsActive = true;
            existing.StartDate = existing.StartDate > now ? now : existing.StartDate;
            existing.EndDate = null;
            existing.AccessSource = source;
            existing.UpdatedAt = now;
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddAsync(UserLicenseAccess access, CancellationToken cancellationToken = default) =>
        await context.UserLicenseAccesses.AddAsync(access, cancellationToken);

    public void Remove(UserLicenseAccess access) => context.UserLicenseAccesses.Remove(access);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
