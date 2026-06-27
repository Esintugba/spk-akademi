using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface ICourseRepository
{
    Task<IReadOnlyList<CourseDto>> GetCoursesAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? licenseId,
        CancellationToken cancellationToken = default);

    Task<CourseDto?> GetCourseDtoAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Course?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> LicenseExistsAsync(Guid licenseId, CancellationToken cancellationToken = default);

    Task AddAsync(Course course, CancellationToken cancellationToken = default);

    void Remove(Course course);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class CourseRepository(DataContext context) : ICourseRepository
{
    public async Task<IReadOnlyList<CourseDto>> GetCoursesAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? licenseId,
        CancellationToken cancellationToken = default)
    {
        var query = context.Courses
            .AsNoTracking()
            .Where(x => accessibleLicenseIds.Contains(x.LicenseId));

        if (licenseId.HasValue)
        {
            query = query.Where(x => x.LicenseId == licenseId.Value);
        }

        return await query
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Name)
            .Select(x => new CourseDto(
                x.Id,
                x.LicenseId,
                x.Name,
                x.Slug,
                x.Description,
                x.Order,
                x.Topics.Count))
            .ToListAsync(cancellationToken);
    }

    public Task<CourseDto?> GetCourseDtoAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Courses
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new CourseDto(
                x.Id,
                x.LicenseId,
                x.Name,
                x.Slug,
                x.Description,
                x.Order,
                x.Topics.Count))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Course?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Courses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> LicenseExistsAsync(Guid licenseId, CancellationToken cancellationToken = default) =>
        context.Licenses.AnyAsync(x => x.Id == licenseId, cancellationToken);

    public async Task AddAsync(Course course, CancellationToken cancellationToken = default) =>
        await context.Courses.AddAsync(course, cancellationToken);

    public void Remove(Course course) => context.Courses.Remove(course);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
