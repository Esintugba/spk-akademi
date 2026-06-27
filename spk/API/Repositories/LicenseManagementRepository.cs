using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface ILicenseManagementRepository
{
    Task<IReadOnlyList<LicenseDto>> GetLicensesAsync(CancellationToken cancellationToken = default);

    Task<License?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(License license, CancellationToken cancellationToken = default);

    void Remove(License license);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class LicenseManagementRepository(DataContext context) : ILicenseManagementRepository
{
    public async Task<IReadOnlyList<LicenseDto>> GetLicensesAsync(CancellationToken cancellationToken = default) =>
        await context.Licenses
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new LicenseDto(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.ShortDescription,
                x.IconUrl,
                x.DisplayOrder,
                x.EstimatedStudyHours,
                x.IsFeatured,
                x.IsActive,
                x.Courses.Count))
            .ToListAsync(cancellationToken);

    public Task<License?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Licenses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(License license, CancellationToken cancellationToken = default) =>
        await context.Licenses.AddAsync(license, cancellationToken);

    public void Remove(License license) => context.Licenses.Remove(license);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
