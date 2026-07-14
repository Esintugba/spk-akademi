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
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TrialExam>> GetFreePublishedAsync(CancellationToken cancellationToken = default) =>
        await context.TrialExams
            .AsNoTracking()
            .Include(x => x.Questions)
                .ThenInclude(x => x.Question)
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                x.IsFree &&
                x.IsPublished &&
                x.AccessLevel == ContentAccessLevel.Free)
            .Where(x =>
                x.Questions.Count(question =>
                    question.Question != null &&
                    !question.Question.IsDeleted &&
                    question.Question.ReviewStatus == ReviewStatus.Approved) >= x.QuestionCount)
            .OrderBy(x => x.Title)
            .ToListAsync(cancellationToken);

    public Task<TrialExam?> GetByIdForDetailAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.TrialExams
            .AsNoTracking()
            .Include(x => x.Questions)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

    public Task<TrialExam?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.TrialExams
            .Include(x => x.Questions)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

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
                    q.Question != null &&
                    !q.Question.IsDeleted &&
                    q.Question.ReviewStatus == ReviewStatus.Approved) >= x.QuestionCount)
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

    public Task<bool> CourseBelongsToLicenseAsync(
        Guid courseId,
        Guid licenseId,
        CancellationToken cancellationToken = default) =>
        context.Courses.AnyAsync(
            course =>
                course.Id == courseId &&
                course.LicenseId == licenseId,
            cancellationToken);

    public Task<int> CountTopicsInCourseAsync(
        IReadOnlyCollection<Guid> topicIds,
        Guid courseId,
        CancellationToken cancellationToken = default) =>
        context.Topics.CountAsync(
            topic =>
                topicIds.Contains(topic.Id) &&
                topic.CourseId == courseId,
            cancellationToken);

    public Task<int> CountEligibleQuestionsAsync(
        IReadOnlyCollection<Guid> questionIds,
        Guid? licenseId,
        Guid? courseId,
        IReadOnlyCollection<Guid> topicIds,
        CancellationToken cancellationToken = default) =>
        context.Questions.CountAsync(
            question =>
                questionIds.Contains(question.Id) &&
                !question.IsDeleted &&
                question.ReviewStatus == ReviewStatus.Approved &&
                question.Topic != null &&
                question.Topic.Course != null &&
                (!licenseId.HasValue ||
                 question.Topic.Course.LicenseId == licenseId.Value) &&
                (!courseId.HasValue ||
                 question.Topic.CourseId == courseId.Value) &&
                (topicIds.Count == 0 || topicIds.Contains(question.TopicId)),
            cancellationToken);

    public async Task<IReadOnlyList<Guid>> GetRandomApprovedQuestionIdsAsync(
        Guid licenseId,
        Guid? courseId,
        IReadOnlyCollection<Guid> topicIds,
        int count,
        CancellationToken cancellationToken = default) =>
        await context.Questions
            .AsNoTracking()
            .Where(question =>
                !question.IsDeleted &&
                question.ReviewStatus == ReviewStatus.Approved &&
                question.Topic != null &&
                question.Topic.Course != null &&
                question.Topic.Course.LicenseId == licenseId &&
                (!courseId.HasValue || question.Topic.CourseId == courseId.Value) &&
                (topicIds.Count == 0 || topicIds.Contains(question.TopicId)))
            .OrderBy(_ => EF.Functions.Random())
            .Select(question => question.Id)
            .Take(count)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(TrialExam exam, CancellationToken cancellationToken = default) =>
        await context.TrialExams.AddAsync(exam, cancellationToken);

    public void RemoveQuestions(IEnumerable<TrialExamQuestion> questions) =>
        context.TrialExamQuestions.RemoveRange(questions);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
