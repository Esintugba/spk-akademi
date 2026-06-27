using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class TrialExamRepository(DataContext context) : ITrialExamRepository
{
    public async Task<IReadOnlyList<TrialExam>> GetAllForManagementAsync(CancellationToken cancellationToken = default) =>
        await context.TrialExams
            .AsNoTracking()
            .Include(x => x.Questions)
            .Include(x => x.ReviewedBy)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TrialExam>> GetFreePublishedAsync(CancellationToken cancellationToken = default) =>
        await context.TrialExams
            .AsNoTracking()
            .Include(x => x.Questions)
                .ThenInclude(x => x.Question)
            .Include(x => x.ReviewedBy)
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                x.IsFree &&
                x.IsPublished &&
                x.AccessLevel == ContentAccessLevel.Free)
            .Where(x =>
                x.Questions.Count(question =>
                    question.Question != null &&
                    question.Question.ReviewStatus == ReviewStatus.Approved) >= x.QuestionCount)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);

    public Task<TrialExam?> GetByIdForDetailAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.TrialExams
            .AsNoTracking()
            .Include(x => x.Questions)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<TrialExam?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.TrialExams
            .Include(x => x.Questions)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<TrialExam?> GetActiveTrialForStartAsync(
        Guid trialExamId,
        CancellationToken cancellationToken = default) =>
        context.TrialExams
            .Include(x => x.Questions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .Include(x => x.License)
            .FirstOrDefaultAsync(
                x => x.Id == trialExamId &&
                     !x.IsDeleted &&
                     x.IsPublished &&
                     x.ReviewStatus == ReviewStatus.Approved,
                cancellationToken);

    public async Task<IReadOnlyList<TrialExam>> GetAccessibleTrialsAsync(
        string userId,
        IReadOnlyList<Guid> activeLicenseIds,
        IReadOnlyList<Guid> purchasedTrialIds,
        CancellationToken cancellationToken = default)
    {
        var licenseIdSet = activeLicenseIds.ToHashSet();
        var purchasedSet = purchasedTrialIds.ToHashSet();

        return await context.TrialExams
            .AsNoTracking()
            .Include(x => x.License)
            .Include(x => x.Questions)
                .ThenInclude(x => x.Question)
            .Where(x =>
                !x.IsDeleted &&
                x.IsPublished &&
                x.ReviewStatus == ReviewStatus.Approved &&
                (x.IsFree ||
                 (x.LicenseId.HasValue && licenseIdSet.Contains(x.LicenseId.Value)) ||
                 purchasedSet.Contains(x.Id)))
            .Where(x =>
                x.Questions.Count(q =>
                    q.Question != null && q.Question.ReviewStatus == ReviewStatus.Approved) >= x.QuestionCount)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasActivePurchaseAsync(
        string userId,
        Guid trialExamId,
        CancellationToken cancellationToken = default) =>
        context.TrialExamPurchases
            .AsNoTracking()
            .AnyAsync(
                x => x.UserId == userId && x.TrialExamId == trialExamId && x.IsActive,
                cancellationToken);

    public async Task<IReadOnlyList<Guid>> GetPurchasedTrialIdsAsync(
        string userId,
        CancellationToken cancellationToken = default) =>
        await context.TrialExamPurchases
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.IsActive)
            .Select(x => x.TrialExamId)
            .ToListAsync(cancellationToken);

    public Task<bool> LicenseExistsAsync(Guid licenseId, CancellationToken cancellationToken = default) =>
        context.Licenses.AnyAsync(x => x.Id == licenseId, cancellationToken);

    public Task<int> CountExistingQuestionsAsync(
        IReadOnlyCollection<Guid> questionIds,
        CancellationToken cancellationToken = default) =>
        context.Questions.CountAsync(x => questionIds.Contains(x.Id), cancellationToken);

    public async Task AddAsync(TrialExam exam, CancellationToken cancellationToken = default) =>
        await context.TrialExams.AddAsync(exam, cancellationToken);

    public void RemoveQuestions(IEnumerable<TrialExamQuestion> questions) =>
        context.TrialExamQuestions.RemoveRange(questions);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
