using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IMaterialProgressService
{
    Task<bool> UpsertProgressAsync(
        string userId,
        MaterialProgressDto dto,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ReadingHistoryItemDto>> GetReadingHistoryAsync(
        string userId,
        int take = 50,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MaterialLibraryItemDto>> GetLibraryAsync(
        string userId,
        int take = 100,
        CancellationToken cancellationToken = default);

    Task<ReadingAnalyticsDto> GetReadingAnalyticsAsync(
        string userId,
        CancellationToken cancellationToken = default);
}

public class MaterialProgressService(
    DataContext context,
    IMaterialRepository materialRepository,
    IMaterialProgressRepository progressRepository,
    ILicenseAccessService accessService) : IMaterialProgressService
{
    public async Task<bool> UpsertProgressAsync(
        string userId,
        MaterialProgressDto dto,
        CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetMaterialAsync(dto.MaterialId, cancellationToken);
        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return false;
        }

        if (!await accessService.CanAccessCourse(userId, material.CourseId))
        {
            return false;
        }

        var maxPage = Math.Max(1, material.PageCount);
        var lastPage = Math.Clamp(dto.LastPage, 1, maxPage);

        var existing = await progressRepository.GetAsync(userId, dto.MaterialId, cancellationToken);
        var now = DateTime.UtcNow;

        if (existing is null)
        {
            existing = new UserMaterialProgress
            {
                UserId = userId,
                MaterialId = dto.MaterialId,
                LastPage = lastPage,
                ProgressPercentage = Math.Clamp(dto.ProgressPercentage, 0, 100),
                LastOpenedAt = now,
                TotalSecondsRead = Math.Max(0, dto.SecondsReadDelta ?? 0),
            };
        }
        else
        {
            existing.LastPage = lastPage;
            existing.ProgressPercentage = Math.Clamp(dto.ProgressPercentage, 0, 100);
            existing.LastOpenedAt = now;
            existing.TotalSecondsRead += Math.Max(0, dto.SecondsReadDelta ?? 0);
            existing.UpdatedAt = now;
        }

        if (existing.ProgressPercentage >= 99.5m && !existing.CompletedAt.HasValue)
        {
            existing.CompletedAt = now;
        }

        progressRepository.Upsert(existing);
        await progressRepository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<ReadingHistoryItemDto>> GetReadingHistoryAsync(
        string userId,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 100);
        var rows = await progressRepository.GetHistoryAsync(userId, take, cancellationToken);
        return rows
            .Where(x => x.Material != null)
            .Select(x => new ReadingHistoryItemDto(
                x.MaterialId,
                x.Material!.Title,
                x.LastPage,
                x.ProgressPercentage,
                x.LastOpenedAt,
                x.CompletedAt,
                x.TotalSecondsRead))
            .ToList();
    }

    public async Task<IReadOnlyList<MaterialLibraryItemDto>> GetLibraryAsync(
        string userId,
        int take = 100,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 200);

        var materials = await context.SourceDocuments
            .AsNoTracking()
            .Include(x => x.Course)
            .Where(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.Approved)
            .OrderBy(x => x.Course!.Name)
            .ThenBy(x => x.Title)
            .Take(take)
            .ToListAsync(cancellationToken);

        var materialIds = materials.Select(x => x.Id).ToList();
        var progresses = await context.UserMaterialProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && materialIds.Contains(x.MaterialId))
            .ToListAsync(cancellationToken);

        var result = new List<MaterialLibraryItemDto>();
        foreach (var material in materials)
        {
            if (!await accessService.CanAccessCourse(userId, material.CourseId))
            {
                continue;
            }

            var progress = progresses.FirstOrDefault(x => x.MaterialId == material.Id);
            result.Add(new MaterialLibraryItemDto(
                material.Id,
                material.CourseId,
                material.Course?.Name ?? "Ders",
                material.Title,
                material.SourceName,
                material.PageCount,
                progress?.LastOpenedAt,
                progress?.LastPage,
                progress?.ProgressPercentage));
        }

        return result;
    }

    public async Task<ReadingAnalyticsDto> GetReadingAnalyticsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var totalSeconds = await context.UserMaterialProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .SumAsync(x => (int?)x.TotalSecondsRead, cancellationToken) ?? 0;

        var completedCount = await context.UserMaterialProgresses
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && x.CompletedAt.HasValue, cancellationToken);

        var activeCount = await context.UserMaterialProgresses
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.CompletedAt.HasValue, cancellationToken);

        var topMaterials = await context.MaterialNotes
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .GroupBy(x => x.MaterialId)
            .Select(g => new { MaterialId = g.Key, NoteCount = g.Count() })
            .OrderByDescending(x => x.NoteCount)
            .Take(5)
            .ToListAsync(cancellationToken);

        var materialTitles = await context.SourceDocuments
            .AsNoTracking()
            .Where(x => topMaterials.Select(t => t.MaterialId).Contains(x.Id))
            .Select(x => new { x.Id, x.Title })
            .ToListAsync(cancellationToken);

        var topDtos = topMaterials
            .Select(x => new ReadingTopMaterialDto(
                x.MaterialId,
                materialTitles.FirstOrDefault(t => t.Id == x.MaterialId)?.Title ?? "PDF",
                x.NoteCount))
            .ToList();

        var from = DateTime.UtcNow.Date.AddDays(-13);
        var daily = await context.UserMaterialProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.LastOpenedAt >= from)
            .GroupBy(x => x.LastOpenedAt.Date)
            .Select(g => new ReadingDailyStatDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Sum(x => x.TotalSecondsRead)))
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);

        return new ReadingAnalyticsDto(
            totalSeconds,
            completedCount,
            activeCount,
            topDtos,
            daily);
    }
}

public interface IMaterialNotesService
{
    Task<IReadOnlyList<MaterialNoteDto>?> GetNotesAsync(string userId, Guid materialId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MyMaterialNoteDto>> GetAllNotesAsync(string userId, int take = 100, CancellationToken cancellationToken = default);
    Task<MaterialNoteDto?> AddNoteAsync(string userId, Guid materialId, CreateMaterialNoteDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateNoteAsync(string userId, Guid noteId, UpdateMaterialNoteDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteNoteAsync(string userId, Guid noteId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReviewMaterialNoteDto>> GetDueReviewsAsync(string userId, int take = 20, CancellationToken cancellationToken = default);
    Task<MaterialNoteReviewResultDto?> ReviewNoteAsync(string userId, Guid noteId, int quality, CancellationToken cancellationToken = default);
}

public class MaterialNotesService(
    IMaterialRepository materialRepository,
    IMaterialNoteRepository noteRepository,
    ILicenseAccessService accessService) : IMaterialNotesService
{
    public async Task<IReadOnlyList<MaterialNoteDto>?> GetNotesAsync(string userId, Guid materialId, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetMaterialAsync(materialId, cancellationToken);
        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return null;
        }

        if (!await accessService.CanAccessCourse(userId, material.CourseId))
        {
            return null;
        }

        var notes = await noteRepository.GetAsync(userId, materialId, cancellationToken);
        return notes
            .Select(x => new MaterialNoteDto(
                x.Id,
                x.MaterialId,
                x.PageNumber,
                x.SelectedText,
                x.Note,
                x.HighlightColor,
                x.IsFavorite,
                x.FolderName,
                ParseTags(x.Tags),
                x.IsInReview,
                x.ReviewRepetition,
                x.ReviewIntervalDays,
                x.NextReviewAt,
                x.CreatedAt,
                x.UpdatedAt))
            .ToList();
    }

    public async Task<IReadOnlyList<MyMaterialNoteDto>> GetAllNotesAsync(string userId, int take = 100, CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 200);
        var notes = await noteRepository.GetAllAsync(userId, take, cancellationToken);
        var result = new List<MyMaterialNoteDto>();

        foreach (var note in notes)
        {
            var material = note.Material;
            if (material is null || !await accessService.CanAccessCourse(userId, material.CourseId))
            {
                continue;
            }

            result.Add(new MyMaterialNoteDto(
                note.Id,
                note.MaterialId,
                material.Title,
                material.CourseId,
                material.Course?.Name ?? "Ders",
                note.PageNumber,
                note.SelectedText,
                note.Note,
                note.HighlightColor,
                note.IsFavorite,
                note.FolderName,
                ParseTags(note.Tags),
                note.IsInReview,
                note.ReviewRepetition,
                note.ReviewIntervalDays,
                note.NextReviewAt,
                note.CreatedAt,
                note.UpdatedAt));
        }

        return result;
    }

    public async Task<MaterialNoteDto?> AddNoteAsync(string userId, Guid materialId, CreateMaterialNoteDto dto, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetMaterialAsync(materialId, cancellationToken);
        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return null;
        }

        if (!await accessService.CanAccessCourse(userId, material.CourseId))
        {
            return null;
        }

        var maxPage = Math.Max(1, material.PageCount);
        var page = Math.Clamp(dto.PageNumber, 1, maxPage);

        var note = new MaterialNote
        {
            UserId = userId,
            MaterialId = materialId,
            PageNumber = page,
            SelectedText = string.IsNullOrWhiteSpace(dto.SelectedText) ? null : dto.SelectedText.Trim(),
            Note = dto.Note.Trim(),
            HighlightColor = dto.HighlightColor,
            FolderName = NormalizeFolderName(dto.FolderName),
            Tags = SerializeTags(dto.Tags),
        };

        await noteRepository.AddAsync(note, cancellationToken);
        await noteRepository.SaveChangesAsync(cancellationToken);

        return new MaterialNoteDto(
            note.Id,
            note.MaterialId,
            note.PageNumber,
            note.SelectedText,
            note.Note,
            note.HighlightColor,
            note.IsFavorite,
            note.FolderName,
            ParseTags(note.Tags),
            note.IsInReview,
            note.ReviewRepetition,
            note.ReviewIntervalDays,
            note.NextReviewAt,
            note.CreatedAt,
            note.UpdatedAt);
    }

    public async Task<bool> UpdateNoteAsync(string userId, Guid noteId, UpdateMaterialNoteDto dto, CancellationToken cancellationToken = default)
    {
        var note = await noteRepository.GetByIdAsync(userId, noteId, cancellationToken);
        if (note is null)
        {
            return false;
        }

        if (dto.Note is not null)
        {
            note.Note = dto.Note.Trim();
        }

        if (dto.HighlightColor.HasValue)
        {
            note.HighlightColor = dto.HighlightColor.Value;
        }

        if (dto.IsFavorite.HasValue)
        {
            note.IsFavorite = dto.IsFavorite.Value;
        }

        if (dto.FolderName is not null)
        {
            note.FolderName = NormalizeFolderName(dto.FolderName);
        }

        if (dto.Tags is not null)
        {
            note.Tags = SerializeTags(dto.Tags);
        }

        if (dto.IsInReview.HasValue)
        {
            note.IsInReview = dto.IsInReview.Value;
            note.NextReviewAt = dto.IsInReview.Value ? note.NextReviewAt ?? DateTime.UtcNow : null;
        }

        note.UpdatedAt = DateTime.UtcNow;
        await noteRepository.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<ReviewMaterialNoteDto>> GetDueReviewsAsync(
        string userId,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        var notes = await noteRepository.GetDueReviewsAsync(userId, Math.Clamp(take, 1, 50), cancellationToken);
        return notes.Select(note => new ReviewMaterialNoteDto(
            note.Id,
            note.MaterialId,
            note.Material?.Title ?? "PDF Notu",
            note.PageNumber,
            string.IsNullOrWhiteSpace(note.SelectedText) ? note.Note : note.SelectedText,
            note.Note,
            note.FolderName,
            ParseTags(note.Tags),
            note.ReviewRepetition,
            note.ReviewIntervalDays,
            note.NextReviewAt)).ToList();
    }

    public async Task<MaterialNoteReviewResultDto?> ReviewNoteAsync(
        string userId,
        Guid noteId,
        int quality,
        CancellationToken cancellationToken = default)
    {
        var note = await noteRepository.GetByIdAsync(userId, noteId, cancellationToken);
        if (note is null || !note.IsInReview)
        {
            return null;
        }

        quality = Math.Clamp(quality, 0, 5);
        var now = DateTime.UtcNow;
        note.TotalReviews += 1;

        if (quality < 3)
        {
            note.ReviewRepetition = 0;
            note.ReviewIntervalDays = 1;
            note.ReviewEaseFactor = Math.Max(1.3m, note.ReviewEaseFactor - 0.2m);
        }
        else
        {
            note.SuccessfulReviews += 1;
            note.ReviewRepetition += 1;
            note.ReviewEaseFactor = Math.Max(
                1.3m,
                Math.Round(note.ReviewEaseFactor + (0.1m - (5 - quality) * (0.08m + (5 - quality) * 0.02m)), 2));
            note.ReviewIntervalDays = note.ReviewRepetition switch
            {
                1 => 1,
                2 => 3,
                3 => 7,
                4 => 14,
                5 => 30,
                _ => Math.Max(1, (int)Math.Round(note.ReviewIntervalDays * note.ReviewEaseFactor))
            };
        }

        note.LastReviewedAt = now;
        note.NextReviewAt = now.AddDays(note.ReviewIntervalDays);
        note.UpdatedAt = now;
        await noteRepository.SaveChangesAsync(cancellationToken);

        return new MaterialNoteReviewResultDto(
            note.Id,
            note.ReviewRepetition,
            note.ReviewIntervalDays,
            note.NextReviewAt.Value);
    }

    private static string? NormalizeFolderName(string? value)
    {
        var folderName = value?.Trim();
        if (string.IsNullOrWhiteSpace(folderName))
        {
            return null;
        }

        return folderName.Length <= 80 ? folderName : folderName[..80];
    }

    private static string SerializeTags(IReadOnlyList<string>? values) =>
        string.Join(",",
            (values ?? [])
                .Select(x => x.Trim().Replace(",", string.Empty))
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(12)
                .Select(x => x.Length <= 40 ? x : x[..40]));

    private static IReadOnlyList<string> ParseTags(string value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public async Task<bool> DeleteNoteAsync(string userId, Guid noteId, CancellationToken cancellationToken = default)
    {
        var note = await noteRepository.GetByIdAsync(userId, noteId, cancellationToken);
        if (note is null)
        {
            return false;
        }

        noteRepository.Remove(note);
        await noteRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public interface IMaterialBookmarksService
{
    Task<IReadOnlyList<MaterialBookmarkDto>?> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default);
    Task<MaterialBookmarkDto?> AddAsync(string userId, Guid materialId, CreateMaterialBookmarkDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string userId, Guid bookmarkId, CancellationToken cancellationToken = default);
}

public class MaterialBookmarksService(
    IMaterialRepository materialRepository,
    IMaterialBookmarkRepository bookmarkRepository,
    ILicenseAccessService accessService) : IMaterialBookmarksService
{
    public async Task<IReadOnlyList<MaterialBookmarkDto>?> GetAsync(string userId, Guid materialId, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetMaterialAsync(materialId, cancellationToken);
        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return null;
        }

        if (!await accessService.CanAccessCourse(userId, material.CourseId))
        {
            return null;
        }

        var bookmarks = await bookmarkRepository.GetAsync(userId, materialId, cancellationToken);
        return bookmarks
            .Select(x => new MaterialBookmarkDto(x.Id, x.MaterialId, x.PageNumber, x.Title, x.CreatedAt))
            .ToList();
    }

    public async Task<MaterialBookmarkDto?> AddAsync(string userId, Guid materialId, CreateMaterialBookmarkDto dto, CancellationToken cancellationToken = default)
    {
        var material = await materialRepository.GetMaterialAsync(materialId, cancellationToken);
        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return null;
        }

        if (!await accessService.CanAccessCourse(userId, material.CourseId))
        {
            return null;
        }

        var maxPage = Math.Max(1, material.PageCount);
        var page = Math.Clamp(dto.PageNumber, 1, maxPage);

        var bookmark = new MaterialBookmark
        {
            UserId = userId,
            MaterialId = materialId,
            PageNumber = page,
            Title = dto.Title.Trim(),
        };

        await bookmarkRepository.AddAsync(bookmark, cancellationToken);
        await bookmarkRepository.SaveChangesAsync(cancellationToken);

        return new MaterialBookmarkDto(bookmark.Id, bookmark.MaterialId, bookmark.PageNumber, bookmark.Title, bookmark.CreatedAt);
    }

    public async Task<bool> DeleteAsync(string userId, Guid bookmarkId, CancellationToken cancellationToken = default)
    {
        var bookmark = await bookmarkRepository.GetByIdAsync(userId, bookmarkId, cancellationToken);
        if (bookmark is null)
        {
            return false;
        }

        bookmarkRepository.Remove(bookmark);
        await bookmarkRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}

