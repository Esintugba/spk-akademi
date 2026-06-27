using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IStudyNoteRepository
{
    Task<IReadOnlyList<PublicStudyNoteDto>> GetPublicStudyNotesAsync(
        Guid? licenseId,
        Guid? courseId,
        Guid? topicId,
        string? search,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudyNoteDto>> GetStudyNotesAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? topicId,
        bool includeUnapproved,
        CancellationToken cancellationToken = default);

    Task<StudyNote?> GetStudyNoteAsync(
        Guid id,
        bool includeUnapproved,
        CancellationToken cancellationToken = default);

    Task<StudyNote?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> TopicExistsAsync(Guid topicId, CancellationToken cancellationToken = default);

    Task AddAsync(StudyNote note, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class StudyNoteRepository(DataContext context) : IStudyNoteRepository
{
    public async Task<IReadOnlyList<PublicStudyNoteDto>> GetPublicStudyNotesAsync(
        Guid? licenseId,
        Guid? courseId,
        Guid? topicId,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var query = context.StudyNotes
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                (x.AccessLevel == ContentAccessLevel.Free || x.AccessLevel == ContentAccessLevel.Trial));

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId.Value);
        }

        if (courseId.HasValue)
        {
            query = query.Where(x => x.Topic != null && x.Topic.CourseId == courseId.Value);
        }

        if (licenseId.HasValue)
        {
            query = query.Where(x =>
                x.Topic != null &&
                x.Topic.Course != null &&
                x.Topic.Course.LicenseId == licenseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(x => x.Title.Contains(keyword) || x.Content.Contains(keyword));
        }

        return await query
            .OrderBy(x => x.Topic!.Course!.License!.Name)
            .ThenBy(x => x.Topic!.Course!.Name)
            .ThenBy(x => x.Topic!.Order)
            .ThenBy(x => x.Title)
            .Select(x => new PublicStudyNoteDto(
                x.Id,
                x.TopicId,
                x.Topic!.Title,
                x.Topic.CourseId,
                x.Topic.Course!.Name,
                x.Topic.Course.LicenseId,
                x.Topic.Course.License!.Name,
                x.Title,
                x.Content,
                x.SourceReference))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StudyNoteDto>> GetStudyNotesAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? topicId,
        bool includeUnapproved,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyVisibility(context.StudyNotes.AsNoTracking(), includeUnapproved)
            .Where(x =>
                x.Topic != null &&
                x.Topic.Course != null &&
                accessibleLicenseIds.Contains(x.Topic.Course.LicenseId));

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId.Value);
        }

        return await query
            .OrderBy(x => x.CreatedAt)
            .Select(x => new StudyNoteDto(
                x.Id,
                x.TopicId,
                x.Title,
                x.Content,
                x.SourceReference,
                x.IsAiGenerated,
                x.ReviewStatus,
                x.AccessLevel,
                x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                x.ReviewedAt,
                x.ReviewComment))
            .ToListAsync(cancellationToken);
    }

    public Task<StudyNote?> GetStudyNoteAsync(
        Guid id,
        bool includeUnapproved,
        CancellationToken cancellationToken = default) =>
        ApplyVisibility(context.StudyNotes.AsNoTracking(), includeUnapproved)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<StudyNote?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.StudyNotes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> TopicExistsAsync(Guid topicId, CancellationToken cancellationToken = default) =>
        context.Topics.AnyAsync(x => x.Id == topicId, cancellationToken);

    public async Task AddAsync(StudyNote note, CancellationToken cancellationToken = default) =>
        await context.StudyNotes.AddAsync(note, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);

    private static IQueryable<StudyNote> ApplyVisibility(
        IQueryable<StudyNote> query,
        bool includeUnapproved) =>
        includeUnapproved
            ? query.Where(x => !x.IsDeleted)
            : query.Where(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.Approved);

}
