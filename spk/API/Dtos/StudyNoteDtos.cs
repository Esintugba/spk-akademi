using API.Entities;

namespace API.Dtos;

public record StudyNoteDto(
    Guid Id,
    Guid TopicId,
    string Title,
    string Content,
    string? SourceReference,
    bool IsAiGenerated,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewComment);

public record PublicStudyNoteDto(
    Guid Id,
    Guid TopicId,
    string TopicTitle,
    Guid CourseId,
    string CourseName,
    Guid LicenseId,
    string LicenseName,
    string Title,
    string Content,
    string? SourceReference);

public record CreateStudyNoteDto(
    Guid TopicId,
    string Title,
    string Content,
    string? SourceReference,
    bool IsAiGenerated,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel);

public record UpdateStudyNoteDto(
    Guid TopicId,
    string Title,
    string Content,
    string? SourceReference,
    bool IsAiGenerated,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel);
