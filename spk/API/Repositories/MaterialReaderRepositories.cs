using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IMaterialRepository
{
    Task<SourceDocument?> GetMaterialAsync(Guid id, CancellationToken cancellationToken = default);
}

public class MaterialRepository(DataContext context) : IMaterialRepository
{
    public Task<SourceDocument?> GetMaterialAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.SourceDocuments
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
}

public interface IMaterialProgressRepository
{
    Task<UserMaterialProgress?> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserMaterialProgress>> GetHistoryAsync(string userId, int take, CancellationToken cancellationToken = default);
    void Upsert(UserMaterialProgress progress);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class MaterialProgressRepository(DataContext context) : IMaterialProgressRepository
{
    public Task<UserMaterialProgress?> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default) =>
        context.UserMaterialProgresses.FirstOrDefaultAsync(x => x.UserId == userId && x.MaterialId == materialId, cancellationToken);

    public Task<IReadOnlyList<UserMaterialProgress>> GetHistoryAsync(string userId, int take, CancellationToken cancellationToken = default) =>
        context.UserMaterialProgresses
            .AsNoTracking()
            .Include(x => x.Material)
            .Where(x => x.UserId == userId && x.Material != null && !x.Material.IsDeleted)
            .OrderByDescending(x => x.LastOpenedAt)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<UserMaterialProgress>)t.Result, cancellationToken);

    public void Upsert(UserMaterialProgress progress)
    {
        if (context.Entry(progress).State == EntityState.Detached)
        {
            context.UserMaterialProgresses.Add(progress);
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}

public interface IMaterialBookmarkRepository
{
    Task<IReadOnlyList<MaterialBookmark>> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default);
    Task<MaterialBookmark?> GetByIdAsync(string userId, Guid bookmarkId, CancellationToken cancellationToken = default);
    Task AddAsync(MaterialBookmark bookmark, CancellationToken cancellationToken = default);
    void Remove(MaterialBookmark bookmark);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class MaterialBookmarkRepository(DataContext context) : IMaterialBookmarkRepository
{
    public async Task<IReadOnlyList<MaterialBookmark>> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default) =>
        await context.MaterialBookmarks
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.MaterialId == materialId)
            .OrderBy(x => x.PageNumber)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<MaterialBookmark?> GetByIdAsync(string userId, Guid bookmarkId, CancellationToken cancellationToken = default) =>
        context.MaterialBookmarks.FirstOrDefaultAsync(x => x.Id == bookmarkId && x.UserId == userId, cancellationToken);

    public Task AddAsync(MaterialBookmark bookmark, CancellationToken cancellationToken = default) =>
        context.MaterialBookmarks.AddAsync(bookmark, cancellationToken).AsTask();

    public void Remove(MaterialBookmark bookmark) => context.MaterialBookmarks.Remove(bookmark);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}

public interface IMaterialNoteRepository
{
    Task<IReadOnlyList<MaterialNote>> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaterialNote>> GetAllAsync(string userId, int take, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaterialNote>> GetDueReviewsAsync(string userId, int take, CancellationToken cancellationToken = default);
    Task<MaterialNote?> GetByIdAsync(string userId, Guid noteId, CancellationToken cancellationToken = default);
    Task AddAsync(MaterialNote note, CancellationToken cancellationToken = default);
    void Remove(MaterialNote note);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class MaterialNoteRepository(DataContext context) : IMaterialNoteRepository
{
    public async Task<IReadOnlyList<MaterialNote>> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default) =>
        await context.MaterialNotes
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.MaterialId == materialId)
            .OrderBy(x => x.PageNumber)
            .ThenByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MaterialNote>> GetAllAsync(string userId, int take, CancellationToken cancellationToken = default) =>
        await context.MaterialNotes
            .AsNoTracking()
            .Include(x => x.Material)
                .ThenInclude(x => x!.Course)
            .Where(x => x.UserId == userId && x.Material != null && !x.Material.IsDeleted && x.Material.ReviewStatus == ReviewStatus.Approved)
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MaterialNote>> GetDueReviewsAsync(string userId, int take, CancellationToken cancellationToken = default) =>
        await context.MaterialNotes
            .AsNoTracking()
            .Include(x => x.Material)
            .Where(x =>
                x.UserId == userId &&
                x.IsInReview &&
                x.NextReviewAt != null &&
                x.NextReviewAt <= DateTime.UtcNow &&
                x.Material != null &&
                !x.Material.IsDeleted &&
                x.Material.ReviewStatus == ReviewStatus.Approved)
            .OrderBy(x => x.NextReviewAt)
            .Take(take)
            .ToListAsync(cancellationToken);

    public Task<MaterialNote?> GetByIdAsync(string userId, Guid noteId, CancellationToken cancellationToken = default) =>
        context.MaterialNotes.FirstOrDefaultAsync(x => x.Id == noteId && x.UserId == userId, cancellationToken);

    public Task AddAsync(MaterialNote note, CancellationToken cancellationToken = default) =>
        context.MaterialNotes.AddAsync(note, cancellationToken).AsTask();

    public void Remove(MaterialNote note) => context.MaterialNotes.Remove(note);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}

