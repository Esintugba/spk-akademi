using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface ISourceDocumentRepository
{
    Task<IReadOnlyList<SourceDocument>> GetDocumentsAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? courseId,
        bool includeUnapproved,
        CancellationToken cancellationToken = default);

    Task<SourceDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<SourceDocument?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> CourseExistsAsync(Guid courseId, CancellationToken cancellationToken = default);

    Task AddAsync(SourceDocument document, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class SourceDocumentRepository(DataContext context) : ISourceDocumentRepository
{
    public async Task<IReadOnlyList<SourceDocument>> GetDocumentsAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? courseId,
        bool includeUnapproved,
        CancellationToken cancellationToken = default)
    {
        var query = context.SourceDocuments
            .AsNoTracking()
            .Include(x => x.Course)
            .Include(x => x.ReviewedBy)
            .Where(x => !x.IsDeleted)
            .Where(x => x.Course != null && accessibleLicenseIds.Contains(x.Course.LicenseId));

        if (!includeUnapproved)
        {
            query = query.Where(x => x.ReviewStatus == ReviewStatus.Approved);
        }

        if (courseId.HasValue)
        {
            query = query.Where(x => x.CourseId == courseId.Value);
        }

        return await query
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);
    }

    public Task<SourceDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.SourceDocuments
            .AsNoTracking()
            .Include(x => x.Course)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

    public Task<SourceDocument?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.SourceDocuments
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

    public Task<bool> CourseExistsAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        context.Courses.AnyAsync(x => x.Id == courseId, cancellationToken);

    public async Task AddAsync(SourceDocument document, CancellationToken cancellationToken = default) =>
        await context.SourceDocuments.AddAsync(document, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
