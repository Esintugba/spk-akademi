using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum CourseManagementError
{
    None,
    Unauthorized,
    Forbidden,
    NotFound,
    InvalidLicense
}

public sealed class CourseManagementOutcome<T>
{
    public CourseManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static CourseManagementOutcome<T> Success(T result) =>
        new() { Error = CourseManagementError.None, Result = result };

    public static CourseManagementOutcome<T> Fail(CourseManagementError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface ICourseManagementService
{
    Task<CourseManagementOutcome<IReadOnlyList<CourseDto>>> GetCoursesAsync(
        string? userId,
        Guid? licenseId,
        CancellationToken cancellationToken = default);

    Task<CourseManagementOutcome<CourseDto>> GetCourseAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<CourseManagementOutcome<CourseDto>> CreateCourseAsync(
        CreateCourseDto dto,
        CancellationToken cancellationToken = default);

    Task<CourseManagementOutcome<bool>> UpdateCourseAsync(
        Guid id,
        UpdateCourseDto dto,
        CancellationToken cancellationToken = default);

    Task<CourseManagementOutcome<bool>> DeleteCourseAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class CourseManagementService(
    ICourseRepository courses,
    ILicenseAccessService accessService,
    ILicenseCatalogCache licenseCatalogCache,
    ISeoCache seoCache) : ICourseManagementService
{
    public async Task<CourseManagementOutcome<IReadOnlyList<CourseDto>>> GetCoursesAsync(
        string? userId,
        Guid? licenseId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return CourseManagementOutcome<IReadOnlyList<CourseDto>>.Fail(CourseManagementError.Unauthorized);
        }

        var accessibleLicenseIds = await accessService.GetAccessibleLicenseIds(userId);
        var result = await courses.GetCoursesAsync(accessibleLicenseIds, licenseId, cancellationToken);

        return CourseManagementOutcome<IReadOnlyList<CourseDto>>.Success(result);
    }

    public async Task<CourseManagementOutcome<CourseDto>> GetCourseAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return CourseManagementOutcome<CourseDto>.Fail(CourseManagementError.Unauthorized);
        }

        if (!await accessService.CanAccessCourse(userId, id))
        {
            return CourseManagementOutcome<CourseDto>.Fail(CourseManagementError.Forbidden);
        }

        var course = await courses.GetCourseDtoAsync(id, cancellationToken);
        return course is null
            ? CourseManagementOutcome<CourseDto>.Fail(CourseManagementError.NotFound)
            : CourseManagementOutcome<CourseDto>.Success(course);
    }

    public async Task<CourseManagementOutcome<CourseDto>> CreateCourseAsync(
        CreateCourseDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!await courses.LicenseExistsAsync(dto.LicenseId, cancellationToken))
        {
            return CourseManagementOutcome<CourseDto>.Fail(
                CourseManagementError.InvalidLicense,
                "LicenseId gecersiz.");
        }

        var course = new Course
        {
            LicenseId = dto.LicenseId,
            Name = dto.Name,
            Slug = dto.Slug,
            Description = dto.Description,
            Order = dto.Order
        };

        await courses.AddAsync(course, cancellationToken);
        await courses.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return CourseManagementOutcome<CourseDto>.Success(
            new CourseDto(course.Id, course.LicenseId, course.Name, course.Slug, course.Description, course.Order, 0));
    }

    public async Task<CourseManagementOutcome<bool>> UpdateCourseAsync(
        Guid id,
        UpdateCourseDto dto,
        CancellationToken cancellationToken = default)
    {
        var course = await courses.GetByIdAsync(id, cancellationToken);
        if (course is null)
        {
            return CourseManagementOutcome<bool>.Fail(CourseManagementError.NotFound);
        }

        if (!await courses.LicenseExistsAsync(dto.LicenseId, cancellationToken))
        {
            return CourseManagementOutcome<bool>.Fail(
                CourseManagementError.InvalidLicense,
                "LicenseId gecersiz.");
        }

        course.LicenseId = dto.LicenseId;
        course.Name = dto.Name;
        course.Slug = dto.Slug;
        course.Description = dto.Description;
        course.Order = dto.Order;
        course.UpdatedAt = DateTime.UtcNow;

        await courses.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return CourseManagementOutcome<bool>.Success(true);
    }

    public async Task<CourseManagementOutcome<bool>> DeleteCourseAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var course = await courses.GetByIdAsync(id, cancellationToken);
        if (course is null)
        {
            return CourseManagementOutcome<bool>.Fail(CourseManagementError.NotFound);
        }

        courses.Remove(course);
        await courses.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return CourseManagementOutcome<bool>.Success(true);
    }

    private void InvalidateCaches()
    {
        licenseCatalogCache.Invalidate();
        seoCache.Invalidate();
    }
}
