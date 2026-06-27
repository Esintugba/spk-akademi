using API.Entities;

namespace API.Services;

public static class UserLicenseAccessRules
{
    public static DateTime? GetEffectiveExpiresAt(UserLicenseAccess access) =>
        access.ExpiresAt ?? access.EndDate;

    public static bool IsExpired(UserLicenseAccess access, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var expiresAt = GetEffectiveExpiresAt(access);
        return expiresAt.HasValue && expiresAt.Value < now;
    }

    public static bool IsCurrentlyActive(UserLicenseAccess access, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        return access.IsActive &&
               access.StartDate <= now &&
               !IsExpired(access, now);
    }
}
