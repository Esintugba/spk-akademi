namespace API.Dtos;

public record CourseDto(
    Guid Id,
    Guid LicenseId,
    string Name,
    string Slug,
    string? Description,
    int Order,
    int TopicCount);

public record CreateCourseDto(
    Guid LicenseId,
    string Name,
    string Slug,
    string? Description,
    int Order);

public record UpdateCourseDto(
    Guid LicenseId,
    string Name,
    string Slug,
    string? Description,
    int Order);
