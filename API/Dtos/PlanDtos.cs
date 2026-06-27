namespace API.Dtos;

public record PlanScopeSummaryDto(
    int CourseCount,
    int TopicCount,
    int QuestionCount,
    int QuizCount,
    int MaterialCount,
    int EstimatedStudyHours);

public record PlanLicenseSummaryDto(
    Guid Id,
    string Name,
    string Slug,
    int CourseCount,
    int TopicCount,
    int QuestionCount,
    int QuizCount,
    int MaterialCount,
    int EstimatedStudyHours,
    bool HasAccess);

public record PlanDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? ShortDescription,
    int DisplayOrder,
    bool IsFeatured,
    bool IsActive,
    bool HasAccess,
    int ActiveLicenseCount,
    PlanScopeSummaryDto Scope,
    IReadOnlyList<PlanLicenseSummaryDto> Licenses);
