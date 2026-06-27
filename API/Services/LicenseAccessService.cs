using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface ILicenseAccessService
{
    Task<IReadOnlyList<Guid>> GetAccessibleLicenseIds(string userId);

    Task<bool> CanAccessLicense(string userId, Guid licenseId);

    Task<bool> CanAccessCourse(string userId, Guid courseId);

    Task<bool> CanAccessTopic(string userId, Guid topicId);

    bool IsCurrentlyActive(UserLicenseAccess access);
}

public class LicenseAccessService(
    DataContext context,
    UserManager<AppUser> userManager) : ILicenseAccessService
{
    public async Task<IReadOnlyList<Guid>> GetAccessibleLicenseIds(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is not null && await userManager.IsInRoleAsync(user, AppRoles.Admin))
        {
            return await context.Licenses.Select(x => x.Id).ToListAsync();
        }

        var now = DateTime.UtcNow;

        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync();

        return accesses
            .Where(x => UserLicenseAccessRules.IsCurrentlyActive(x))
            .Select(x => x.LicenseId)
            .ToList();
    }

    public async Task<bool> CanAccessLicense(string userId, Guid licenseId)
    {
        var licenseIds = await GetAccessibleLicenseIds(userId);
        return licenseIds.Contains(licenseId);
    }

    public async Task<bool> CanAccessCourse(string userId, Guid courseId)
    {
        var licenseId = await context.Courses
            .Where(x => x.Id == courseId)
            .Select(x => x.LicenseId)
            .FirstOrDefaultAsync();

        return licenseId != Guid.Empty && await CanAccessLicense(userId, licenseId);
    }

    public async Task<bool> CanAccessTopic(string userId, Guid topicId)
    {
        var licenseId = await context.Topics
            .Where(x => x.Id == topicId)
            .Select(x => x.Course!.LicenseId)
            .FirstOrDefaultAsync();

        return licenseId != Guid.Empty && await CanAccessLicense(userId, licenseId);
    }

    public bool IsCurrentlyActive(UserLicenseAccess access) =>
        UserLicenseAccessRules.IsCurrentlyActive(access);
}
