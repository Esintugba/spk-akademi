namespace API.Dtos;

public record LicenseDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription,
    string? IconUrl,
    int DisplayOrder,
    int EstimatedStudyHours,
    bool IsFeatured,
    bool IsActive,
    int CourseCount);

public record CreateLicenseDto(
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription = null,
    string? IconUrl = null,
    int DisplayOrder = 0,
    int EstimatedStudyHours = 0,
    bool IsFeatured = false,
    bool IsActive = true);

public record UpdateLicenseDto(
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription = null,
    string? IconUrl = null,
    int DisplayOrder = 0,
    int EstimatedStudyHours = 0,
    bool IsFeatured = false,
    bool IsActive = true);

public record LicenseCourseSummaryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder,
    int TopicCount,
    int QuestionCount,
    int MaterialCount);

public record LicenseQuizSummaryDto(
    Guid Id,
    string Title,
    string Slug,
    int QuestionCount,
    int Duration);

public record LicenseCatalogAnalyticsDto(
    int EnrolledStudentCount,
    int ActiveStudentCount,
    decimal AverageScore);

public record LicenseCatalogDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription,
    string? IconUrl,
    int DisplayOrder,
    int CourseCount,
    int TopicCount,
    int QuestionCount,
    int QuizCount,
    int MaterialCount,
    int EstimatedStudyHours,
    bool IsActive,
    bool IsFeatured,
    bool HasAccess,
    IReadOnlyList<LicenseCourseSummaryDto> Courses,
    IReadOnlyList<LicenseQuizSummaryDto> Quizzes,
    LicenseCatalogAnalyticsDto Analytics);
