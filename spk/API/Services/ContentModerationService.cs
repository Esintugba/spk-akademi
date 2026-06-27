using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IContentModerationService
{
    Task<ModerationListResponseDto> GetItemsAsync(
        ModerationContentType? contentType,
        ReviewStatus? reviewStatus,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ModerationHistoryDto>> GetHistoryAsync(
        ModerationContentType contentType,
        Guid contentId,
        CancellationToken cancellationToken = default);

    Task ModerateAsync(ModerateContentRequestDto request, string reviewerId, CancellationToken cancellationToken = default);

    Task BulkModerateAsync(BulkModerateContentRequestDto request, string reviewerId, CancellationToken cancellationToken = default);
}

public class ContentModerationService(
    DataContext context,
    UserManager<AppUser> userManager) : IContentModerationService
{
    public async Task<ModerationListResponseDto> GetItemsAsync(
        ModerationContentType? contentType,
        ReviewStatus? reviewStatus,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var items = new List<ModerationItemDto>();

        if (contentType is null || contentType == ModerationContentType.Question)
        {
            items.AddRange(await context.Questions
                .AsNoTracking()
                .Where(x => !x.IsDeleted)
                .Where(x => !reviewStatus.HasValue || x.ReviewStatus == reviewStatus.Value)
                .Where(x => string.IsNullOrWhiteSpace(search) || x.Text.Contains(search) || (x.SourceReference ?? string.Empty).Contains(search))
                .Include(x => x.Topic)
                .Include(x => x.ReviewedBy)
                .Select(x => new ModerationItemDto(
                    ModerationContentType.Question,
                    x.Id,
                    x.Text,
                    x.Topic != null ? x.Topic.Title : null,
                    x.ReviewStatus,
                    x.AccessLevel,
                    x.IsAiGenerated,
                    x.CreatedAt,
                    x.UpdatedAt,
                    x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                    x.ReviewedAt,
                    x.ReviewComment))
                .ToListAsync(cancellationToken));
        }

        if (contentType is null || contentType == ModerationContentType.StudyNote)
        {
            items.AddRange(await context.StudyNotes
                .AsNoTracking()
                .Where(x => !x.IsDeleted)
                .Where(x => !reviewStatus.HasValue || x.ReviewStatus == reviewStatus.Value)
                .Where(x => string.IsNullOrWhiteSpace(search) || x.Title.Contains(search) || x.Content.Contains(search))
                .Include(x => x.Topic)
                .Include(x => x.ReviewedBy)
                .Select(x => new ModerationItemDto(
                    ModerationContentType.StudyNote,
                    x.Id,
                    x.Title,
                    x.Topic != null ? x.Topic.Title : null,
                    x.ReviewStatus,
                    x.AccessLevel,
                    x.IsAiGenerated,
                    x.CreatedAt,
                    x.UpdatedAt,
                    x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                    x.ReviewedAt,
                    x.ReviewComment))
                .ToListAsync(cancellationToken));
        }

        if (contentType is null || contentType == ModerationContentType.SourceDocument)
        {
            items.AddRange(await context.SourceDocuments
                .AsNoTracking()
                .Where(x => !x.IsDeleted)
                .Where(x => !reviewStatus.HasValue || x.ReviewStatus == reviewStatus.Value)
                .Where(x => string.IsNullOrWhiteSpace(search) || x.Title.Contains(search) || x.FileName.Contains(search))
                .Include(x => x.Course)
                .Include(x => x.ReviewedBy)
                .Select(x => new ModerationItemDto(
                    ModerationContentType.SourceDocument,
                    x.Id,
                    x.Title,
                    x.Course != null ? x.Course.Name : x.FileName,
                    x.ReviewStatus,
                    x.AccessLevel,
                    false,
                    x.CreatedAt,
                    x.UpdatedAt,
                    x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                    x.ReviewedAt,
                    x.ReviewComment))
                .ToListAsync(cancellationToken));
        }

        if (contentType is null || contentType == ModerationContentType.TrialExam)
        {
            items.AddRange(await context.TrialExams
                .AsNoTracking()
                .Where(x => !x.IsDeleted)
                .Where(x => !reviewStatus.HasValue || x.ReviewStatus == reviewStatus.Value)
                .Where(x => string.IsNullOrWhiteSpace(search) || x.Title.Contains(search) || x.Description.Contains(search))
                .Include(x => x.License)
                .Include(x => x.ReviewedBy)
                .Select(x => new ModerationItemDto(
                    ModerationContentType.TrialExam,
                    x.Id,
                    x.Title,
                    x.License != null ? x.License.Name : null,
                    x.ReviewStatus,
                    x.AccessLevel,
                    false,
                    x.CreatedAt,
                    x.UpdatedAt,
                    x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                    x.ReviewedAt,
                    x.ReviewComment))
                .ToListAsync(cancellationToken));
        }

        var ordered = items
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .ThenBy(x => x.Title)
            .ToList();

        var totalCount = ordered.Count;
        var paged = ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new ModerationListResponseDto(paged, totalCount, page, pageSize);
    }

    public async Task<IReadOnlyList<ModerationHistoryDto>> GetHistoryAsync(
        ModerationContentType contentType,
        Guid contentId,
        CancellationToken cancellationToken = default)
    {
        return await context.ModerationHistories
            .AsNoTracking()
            .Where(x => x.ContentType == contentType.ToString() && x.ContentId == contentId)
            .Include(x => x.Reviewer)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ModerationHistoryDto(
                x.Id,
                x.FromStatus,
                x.ToStatus,
                x.Reviewer != null ? x.Reviewer.Email : null,
                x.Comment,
                x.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task ModerateAsync(ModerateContentRequestDto request, string reviewerId, CancellationToken cancellationToken = default)
    {
        var reviewer = await userManager.FindByIdAsync(reviewerId);
        var now = DateTime.UtcNow;

        var entity = await ResolveEntityAsync(request.ContentType, request.ContentId, cancellationToken);

        if (entity is null)
        {
            throw new InvalidOperationException("İçerik bulunamadı.");
        }

        var previousStatus = entity.ReviewStatus;
        entity.ReviewStatus = request.ReviewStatus;
        entity.ReviewComment = string.IsNullOrWhiteSpace(request.ReviewComment) ? null : request.ReviewComment.Trim();
        entity.ReviewedAt = now;
        entity.ReviewedById = reviewerId;
        entity.AccessLevel = request.AccessLevel ?? entity.AccessLevel;
        entity.UpdatedAt = now;

        context.ModerationHistories.Add(new ModerationHistory
        {
            ContentType = request.ContentType.ToString(),
            ContentId = request.ContentId,
            FromStatus = previousStatus,
            ToStatus = request.ReviewStatus,
            ReviewerId = reviewer?.Id,
            Comment = entity.ReviewComment
        });

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task BulkModerateAsync(BulkModerateContentRequestDto request, string reviewerId, CancellationToken cancellationToken = default)
    {
        foreach (var item in request.Items)
        {
          await ModerateAsync(item, reviewerId, cancellationToken);
        }
    }

    private async Task<ModeratedEntity?> ResolveEntityAsync(ModerationContentType contentType, Guid contentId, CancellationToken cancellationToken)
    {
        return contentType switch
        {
            ModerationContentType.Question => await context.Questions.FirstOrDefaultAsync(x => x.Id == contentId, cancellationToken),
            ModerationContentType.StudyNote => await context.StudyNotes.FirstOrDefaultAsync(x => x.Id == contentId, cancellationToken),
            ModerationContentType.SourceDocument => await context.SourceDocuments.FirstOrDefaultAsync(x => x.Id == contentId, cancellationToken),
            ModerationContentType.TrialExam => await context.TrialExams.FirstOrDefaultAsync(x => x.Id == contentId, cancellationToken),
            _ => null
        };
    }
}
