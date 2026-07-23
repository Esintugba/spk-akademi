using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum AccessApprovalReversalResult
{
    Success,
    AccessChangedSinceApproval
}

public interface IAccessApprovalService
{
    Task GrantPlanAccessAsync(
        AccessRequest request,
        CancellationToken cancellationToken = default);

    Task<AccessApprovalReversalResult> RevokePlanAccessAsync(
        AccessRequest request,
        CancellationToken cancellationToken = default);
}

public class AccessApprovalService(DataContext context) : IAccessApprovalService
{
    public async Task GrantPlanAccessAsync(
        AccessRequest request,
        CancellationToken cancellationToken = default)
    {
        var licenseIds = await context.PlanLicenses
            .AsNoTracking()
            .Where(x => x.PlanId == request.PlanId)
            .Select(x => x.LicenseId)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;

        foreach (var licenseId in licenseIds)
        {
            var existing = await context.UserLicenseAccesses
                .FirstOrDefaultAsync(
                    x => x.UserId == request.StudentId && x.LicenseId == licenseId,
                    cancellationToken);

            if (existing is not null && UserLicenseAccessRules.IsCurrentlyActive(existing, now))
            {
                continue;
            }

            var wasCreated = existing is null;
            var access = existing ?? new UserLicenseAccess
            {
                UserId = request.StudentId,
                LicenseId = licenseId,
                CreatedAt = now
            };

            var grant = new AccessRequestAccessGrant
            {
                AccessRequestId = request.Id,
                LicenseId = licenseId,
                UserLicenseAccessId = access.Id,
                WasCreated = wasCreated,
                PreviousStartDate = existing?.StartDate,
                PreviousEndDate = existing?.EndDate,
                PreviousIsActive = existing?.IsActive,
                PreviousAccessSource = existing?.AccessSource,
                PreviousIsDemoAccess = existing?.IsDemoAccess,
                PreviousGrantedAutomatically = existing?.GrantedAutomatically,
                PreviousExpiresAt = existing?.ExpiresAt,
                AppliedAt = now
            };

            access.StartDate = wasCreated || access.StartDate > now ? now : access.StartDate;
            access.EndDate = null;
            access.IsActive = true;
            access.AccessSource = AccessSource.Beta;
            access.IsDemoAccess = false;
            access.GrantedAutomatically = false;
            access.ExpiresAt = null;
            access.UpdatedAt = now;

            grant.AppliedStartDate = access.StartDate;
            grant.AppliedEndDate = access.EndDate;
            grant.AppliedIsActive = access.IsActive;
            grant.AppliedAccessSource = access.AccessSource;
            grant.AppliedIsDemoAccess = access.IsDemoAccess;
            grant.AppliedGrantedAutomatically = access.GrantedAutomatically;
            grant.AppliedExpiresAt = access.ExpiresAt;

            if (wasCreated)
            {
                context.UserLicenseAccesses.Add(access);
            }

            context.AccessRequestAccessGrants.Add(grant);
        }
    }

    public async Task<AccessApprovalReversalResult> RevokePlanAccessAsync(
        AccessRequest request,
        CancellationToken cancellationToken = default)
    {
        var grants = request.AccessGrants
            .Where(x => x.RevertedAt is null)
            .ToList();

        if (grants.Count == 0)
        {
            return await CanSafelyCorrectLegacyApprovalAsync(request, cancellationToken)
                ? AccessApprovalReversalResult.Success
                : AccessApprovalReversalResult.AccessChangedSinceApproval;
        }

        var accessIds = grants.Select(x => x.UserLicenseAccessId).ToList();
        var accesses = await context.UserLicenseAccesses
            .Where(x => accessIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        foreach (var grant in grants)
        {
            if (!accesses.TryGetValue(grant.UserLicenseAccessId, out var access))
            {
                if (grant.WasCreated)
                {
                    var replacementExists = await context.UserLicenseAccesses
                        .AsNoTracking()
                        .AnyAsync(
                            x => x.UserId == request.StudentId && x.LicenseId == grant.LicenseId,
                            cancellationToken);
                    if (replacementExists)
                    {
                        return AccessApprovalReversalResult.AccessChangedSinceApproval;
                    }

                    continue;
                }

                return AccessApprovalReversalResult.AccessChangedSinceApproval;
            }

            if (!MatchesAppliedState(access, grant))
            {
                return AccessApprovalReversalResult.AccessChangedSinceApproval;
            }
        }

        var now = DateTime.UtcNow;
        foreach (var grant in grants)
        {
            if (accesses.TryGetValue(grant.UserLicenseAccessId, out var access))
            {
                if (grant.WasCreated)
                {
                    context.UserLicenseAccesses.Remove(access);
                }
                else
                {
                    access.StartDate = grant.PreviousStartDate!.Value;
                    access.EndDate = grant.PreviousEndDate;
                    access.IsActive = grant.PreviousIsActive!.Value;
                    access.AccessSource = grant.PreviousAccessSource!.Value;
                    access.IsDemoAccess = grant.PreviousIsDemoAccess!.Value;
                    access.GrantedAutomatically = grant.PreviousGrantedAutomatically!.Value;
                    access.ExpiresAt = grant.PreviousExpiresAt;
                    access.UpdatedAt = now;
                }
            }

            grant.RevertedAt = now;
            grant.UpdatedAt = now;
        }

        return AccessApprovalReversalResult.Success;
    }

    private async Task<bool> CanSafelyCorrectLegacyApprovalAsync(
        AccessRequest request,
        CancellationToken cancellationToken)
    {
        var licenseIds = await context.PlanLicenses
            .AsNoTracking()
            .Where(x => x.PlanId == request.PlanId)
            .Select(x => x.LicenseId)
            .ToListAsync(cancellationToken);

        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.UserId == request.StudentId && licenseIds.Contains(x.LicenseId))
            .ToListAsync(cancellationToken);

        return accesses.All(x => !UserLicenseAccessRules.IsCurrentlyActive(x));
    }

    private static bool MatchesAppliedState(
        UserLicenseAccess access,
        AccessRequestAccessGrant grant) =>
        access.UpdatedAt == grant.AppliedAt
        && access.StartDate == grant.AppliedStartDate
        && access.EndDate == grant.AppliedEndDate
        && access.IsActive == grant.AppliedIsActive
        && access.AccessSource == grant.AppliedAccessSource
        && access.IsDemoAccess == grant.AppliedIsDemoAccess
        && access.GrantedAutomatically == grant.AppliedGrantedAutomatically
        && access.ExpiresAt == grant.AppliedExpiresAt;
}
