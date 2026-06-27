using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum StudyNoteManagementError
{
    None,
    Unauthorized,
    Forbidden,
    NotFound,
    InvalidTopic
}

public sealed class StudyNoteManagementOutcome<T>
{
    public StudyNoteManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static StudyNoteManagementOutcome<T> Success(T result) =>
        new() { Error = StudyNoteManagementError.None, Result = result };

    public static StudyNoteManagementOutcome<T> Fail(StudyNoteManagementError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IStudyNoteManagementService
{
    Task<IReadOnlyList<PublicStudyNoteDto>> GetPublicStudyNotesAsync(
        Guid? licenseId,
        Guid? courseId,
        Guid? topicId,
        string? search,
        CancellationToken cancellationToken = default);

    Task<StudyNoteManagementOutcome<IReadOnlyList<StudyNoteDto>>> GetStudyNotesAsync(
        string? userId,
        bool isAdmin,
        Guid? topicId,
        CancellationToken cancellationToken = default);

    Task<StudyNoteManagementOutcome<StudyNoteDto>> GetStudyNoteAsync(
        string? userId,
        bool isAdmin,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<StudyNoteManagementOutcome<StudyNoteDto>> CreateStudyNoteAsync(
        CreateStudyNoteDto dto,
        CancellationToken cancellationToken = default);

    Task<StudyNoteManagementOutcome<bool>> UpdateStudyNoteAsync(
        Guid id,
        UpdateStudyNoteDto dto,
        CancellationToken cancellationToken = default);

    Task<StudyNoteManagementOutcome<bool>> DeleteStudyNoteAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class StudyNoteManagementService(
    IStudyNoteRepository studyNotes,
    ILicenseAccessService accessService) : IStudyNoteManagementService
{
    public Task<IReadOnlyList<PublicStudyNoteDto>> GetPublicStudyNotesAsync(
        Guid? licenseId,
        Guid? courseId,
        Guid? topicId,
        string? search,
        CancellationToken cancellationToken = default) =>
        studyNotes.GetPublicStudyNotesAsync(licenseId, courseId, topicId, search, cancellationToken);

    public async Task<StudyNoteManagementOutcome<IReadOnlyList<StudyNoteDto>>> GetStudyNotesAsync(
        string? userId,
        bool isAdmin,
        Guid? topicId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return StudyNoteManagementOutcome<IReadOnlyList<StudyNoteDto>>.Fail(StudyNoteManagementError.Unauthorized);
        }

        var accessibleLicenseIds = await accessService.GetAccessibleLicenseIds(userId);
        var notes = await studyNotes.GetStudyNotesAsync(
            accessibleLicenseIds,
            topicId,
            includeUnapproved: isAdmin,
            cancellationToken);

        return StudyNoteManagementOutcome<IReadOnlyList<StudyNoteDto>>.Success(notes);
    }

    public async Task<StudyNoteManagementOutcome<StudyNoteDto>> GetStudyNoteAsync(
        string? userId,
        bool isAdmin,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return StudyNoteManagementOutcome<StudyNoteDto>.Fail(StudyNoteManagementError.Unauthorized);
        }

        var note = await studyNotes.GetStudyNoteAsync(id, includeUnapproved: isAdmin, cancellationToken);
        if (note is null)
        {
            return StudyNoteManagementOutcome<StudyNoteDto>.Fail(StudyNoteManagementError.NotFound);
        }

        if (!await accessService.CanAccessTopic(userId, note.TopicId))
        {
            return StudyNoteManagementOutcome<StudyNoteDto>.Fail(StudyNoteManagementError.Forbidden);
        }

        return StudyNoteManagementOutcome<StudyNoteDto>.Success(ToDto(note));
    }

    public async Task<StudyNoteManagementOutcome<StudyNoteDto>> CreateStudyNoteAsync(
        CreateStudyNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!await studyNotes.TopicExistsAsync(dto.TopicId, cancellationToken))
        {
            return StudyNoteManagementOutcome<StudyNoteDto>.Fail(
                StudyNoteManagementError.InvalidTopic,
                "TopicId gecersiz.");
        }

        var note = new StudyNote
        {
            TopicId = dto.TopicId,
            Title = dto.Title,
            Content = dto.Content,
            SourceReference = dto.SourceReference,
            IsAiGenerated = dto.IsAiGenerated,
            ReviewStatus = dto.ReviewStatus,
            AccessLevel = dto.AccessLevel
        };

        await studyNotes.AddAsync(note, cancellationToken);
        await studyNotes.SaveChangesAsync(cancellationToken);

        return StudyNoteManagementOutcome<StudyNoteDto>.Success(ToDto(note));
    }

    public async Task<StudyNoteManagementOutcome<bool>> UpdateStudyNoteAsync(
        Guid id,
        UpdateStudyNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        var note = await studyNotes.GetByIdAsync(id, cancellationToken);
        if (note is null)
        {
            return StudyNoteManagementOutcome<bool>.Fail(StudyNoteManagementError.NotFound);
        }

        if (!await studyNotes.TopicExistsAsync(dto.TopicId, cancellationToken))
        {
            return StudyNoteManagementOutcome<bool>.Fail(
                StudyNoteManagementError.InvalidTopic,
                "TopicId gecersiz.");
        }

        note.TopicId = dto.TopicId;
        note.Title = dto.Title;
        note.Content = dto.Content;
        note.SourceReference = dto.SourceReference;
        note.IsAiGenerated = dto.IsAiGenerated;
        note.ReviewStatus = dto.ReviewStatus;
        note.AccessLevel = dto.AccessLevel;
        note.UpdatedAt = DateTime.UtcNow;

        await studyNotes.SaveChangesAsync(cancellationToken);

        return StudyNoteManagementOutcome<bool>.Success(true);
    }

    public async Task<StudyNoteManagementOutcome<bool>> DeleteStudyNoteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var note = await studyNotes.GetByIdAsync(id, cancellationToken);
        if (note is null)
        {
            return StudyNoteManagementOutcome<bool>.Fail(StudyNoteManagementError.NotFound);
        }

        note.IsDeleted = true;
        note.DeletedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;
        await studyNotes.SaveChangesAsync(cancellationToken);

        return StudyNoteManagementOutcome<bool>.Success(true);
    }

    private static StudyNoteDto ToDto(StudyNote note) =>
        new(
            note.Id,
            note.TopicId,
            note.Title,
            note.Content,
            note.SourceReference,
            note.IsAiGenerated,
            note.ReviewStatus,
            note.AccessLevel,
            note.ReviewedBy?.Email,
            note.ReviewedAt,
            note.ReviewComment);
}
