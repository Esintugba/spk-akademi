using API.Data;
using API.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace API.Services;

public interface IPlanCatalogCache
{
    void Invalidate();
}

public interface IPlanCatalogService : IPlanCatalogCache
{
    Task<IReadOnlyList<PlanDto>> GetCatalogAsync(
        string? userId,
        CancellationToken cancellationToken = default);

    Task<PlanDto?> GetByIdAsync(
        Guid id,
        string? userId,
        CancellationToken cancellationToken = default);
}

public class PlanCatalogService(
    DataContext context,
    ILicenseCatalogService licenseCatalogService,
    IMemoryCache memoryCache) : IPlanCatalogService
{
    private const string PlanCacheKey = "plan-catalog:active:v1";
    private static readonly MemoryCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
        SlidingExpiration = TimeSpan.FromMinutes(2)
    };

    public async Task<IReadOnlyList<PlanDto>> GetCatalogAsync(
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var planRows = await memoryCache.GetOrCreateAsync(
            PlanCacheKey,
            async entry =>
            {
                entry.SetOptions(CacheOptions);
                return await context.Plans
                    .AsNoTracking()
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.DisplayOrder)
                    .ThenBy(x => x.Name)
                    .Select(x => new PlanRow(
                        x.Id,
                        x.Name,
                        x.Slug,
                        x.Description,
                        x.ShortDescription,
                        x.DisplayOrder,
                        x.IsFeatured,
                        x.IsActive,
                        x.PlanLicenses
                            .OrderBy(planLicense => planLicense.License!.DisplayOrder)
                            .ThenBy(planLicense => planLicense.License!.Name)
                            .Select(planLicense => planLicense.LicenseId)
                            .ToList()))
                    .ToListAsync(cancellationToken);
            }) ?? [];

        var licenses = await licenseCatalogService.GetCatalogAsync(userId, cancellationToken);
        var licenseById = licenses.ToDictionary(x => x.Id);

        return planRows.Select(plan =>
        {
            var planLicenses = plan.LicenseIds
                .Select(id => licenseById.GetValueOrDefault(id))
                .Where(license => license is not null)
                .Select(license => license!)
                .ToList();

            var activeLicenseCount = planLicenses.Count(x => x.HasAccess);
            var hasAccess = planLicenses.Count > 0 && activeLicenseCount == planLicenses.Count;

            return new PlanDto(
                plan.Id,
                plan.Name,
                plan.Slug,
                plan.Description,
                plan.ShortDescription,
                plan.DisplayOrder,
                plan.IsFeatured,
                plan.IsActive,
                hasAccess,
                activeLicenseCount,
                new PlanScopeSummaryDto(
                    planLicenses.Sum(x => x.CourseCount),
                    planLicenses.Sum(x => x.TopicCount),
                    planLicenses.Sum(x => x.QuestionCount),
                    planLicenses.Sum(x => x.QuizCount),
                    planLicenses.Sum(x => x.MaterialCount),
                    planLicenses.Sum(x => x.EstimatedStudyHours)),
                planLicenses.Select(license => new PlanLicenseSummaryDto(
                    license.Id,
                    license.Name,
                    license.Slug,
                    license.CourseCount,
                    license.TopicCount,
                    license.QuestionCount,
                    license.QuizCount,
                    license.MaterialCount,
                    license.EstimatedStudyHours,
                    license.HasAccess)).ToList());
        }).ToList();
    }

    public async Task<PlanDto?> GetByIdAsync(
        Guid id,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var plans = await GetCatalogAsync(userId, cancellationToken);
        return plans.FirstOrDefault(x => x.Id == id);
    }

    public void Invalidate() => memoryCache.Remove(PlanCacheKey);

    private sealed record PlanRow(
        Guid Id,
        string Name,
        string Slug,
        string? Description,
        string? ShortDescription,
        int DisplayOrder,
        bool IsFeatured,
        bool IsActive,
        IReadOnlyList<Guid> LicenseIds);
}
