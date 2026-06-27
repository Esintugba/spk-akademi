using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum LicenseManagementError
{
    None,
    NotFound
}

public sealed class LicenseManagementOutcome<T>
{
    public LicenseManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static LicenseManagementOutcome<T> Success(T result) =>
        new() { Error = LicenseManagementError.None, Result = result };

    public static LicenseManagementOutcome<T> Fail(LicenseManagementError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface ILicenseManagementService
{
    Task<IReadOnlyList<LicenseDto>> GetLicensesAsync(CancellationToken cancellationToken = default);

    Task<LicenseManagementOutcome<LicenseDto>> CreateLicenseAsync(
        CreateLicenseDto dto,
        CancellationToken cancellationToken = default);

    Task<LicenseManagementOutcome<bool>> UpdateLicenseAsync(
        Guid id,
        UpdateLicenseDto dto,
        CancellationToken cancellationToken = default);

    Task<LicenseManagementOutcome<bool>> DeleteLicenseAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class LicenseManagementService(
    ILicenseManagementRepository licenses,
    ILicenseCatalogCache licenseCatalogCache,
    ISeoCache seoCache) : ILicenseManagementService
{
    public Task<IReadOnlyList<LicenseDto>> GetLicensesAsync(CancellationToken cancellationToken = default) =>
        licenses.GetLicensesAsync(cancellationToken);

    public async Task<LicenseManagementOutcome<LicenseDto>> CreateLicenseAsync(
        CreateLicenseDto dto,
        CancellationToken cancellationToken = default)
    {
        var license = new License
        {
            Name = dto.Name,
            Slug = dto.Slug,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            IconUrl = dto.IconUrl,
            DisplayOrder = dto.DisplayOrder,
            EstimatedStudyHours = dto.EstimatedStudyHours,
            IsFeatured = dto.IsFeatured,
            IsActive = dto.IsActive
        };

        await licenses.AddAsync(license, cancellationToken);
        await licenses.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return LicenseManagementOutcome<LicenseDto>.Success(ToDto(license, courseCount: 0));
    }

    public async Task<LicenseManagementOutcome<bool>> UpdateLicenseAsync(
        Guid id,
        UpdateLicenseDto dto,
        CancellationToken cancellationToken = default)
    {
        var license = await licenses.GetByIdAsync(id, cancellationToken);
        if (license is null)
        {
            return LicenseManagementOutcome<bool>.Fail(LicenseManagementError.NotFound);
        }

        license.Name = dto.Name;
        license.Slug = dto.Slug;
        license.Description = dto.Description;
        license.ShortDescription = dto.ShortDescription;
        license.IconUrl = dto.IconUrl;
        license.DisplayOrder = dto.DisplayOrder;
        license.EstimatedStudyHours = dto.EstimatedStudyHours;
        license.IsFeatured = dto.IsFeatured;
        license.IsActive = dto.IsActive;
        license.UpdatedAt = DateTime.UtcNow;

        await licenses.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return LicenseManagementOutcome<bool>.Success(true);
    }

    public async Task<LicenseManagementOutcome<bool>> DeleteLicenseAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var license = await licenses.GetByIdAsync(id, cancellationToken);
        if (license is null)
        {
            return LicenseManagementOutcome<bool>.Fail(LicenseManagementError.NotFound);
        }

        licenses.Remove(license);
        await licenses.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return LicenseManagementOutcome<bool>.Success(true);
    }

    private void InvalidateCaches()
    {
        licenseCatalogCache.Invalidate();
        seoCache.Invalidate();
    }

    private static LicenseDto ToDto(License license, int courseCount) =>
        new(
            license.Id,
            license.Name,
            license.Slug,
            license.Description,
            license.ShortDescription,
            license.IconUrl,
            license.DisplayOrder,
            license.EstimatedStudyHours,
            license.IsFeatured,
            license.IsActive,
            courseCount);
}
