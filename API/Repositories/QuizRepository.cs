using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class QuizRepository(DataContext context) : IQuizRepository
{
    public IQueryable<TrialExam> QueryPublishedQuizzes(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        IReadOnlyCollection<Guid> purchasedQuizIds)
    {
        return context.TrialExams
            .AsNoTracking()
            .Include(x => x.License)
            .Where(x =>
                !x.IsDeleted &&
                x.IsPublished &&
                x.ReviewStatus == ReviewStatus.Approved &&
                (x.IsFree ||
                 (x.LicenseId.HasValue && accessibleLicenseIds.Contains(x.LicenseId.Value)) ||
                 purchasedQuizIds.Contains(x.Id)))
            .Where(x =>
                x.Questions.Count(q =>
                    q.Question != null && q.Question.ReviewStatus == ReviewStatus.Approved) >= x.QuestionCount);
    }

    public Task<TrialExam?> GetPublishedQuizAsync(
        Guid quizId,
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        IReadOnlyCollection<Guid> purchasedQuizIds,
        CancellationToken cancellationToken = default) =>
        QueryPublishedQuizzes(accessibleLicenseIds, purchasedQuizIds)
            .Include(x => x.Questions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Topic)
                        .ThenInclude(x => x!.Course)
            .FirstOrDefaultAsync(x => x.Id == quizId, cancellationToken);

    public async Task<IReadOnlyList<QuizAttempt>> GetLatestAttemptsAsync(
        string userId,
        IReadOnlyCollection<Guid> quizIds,
        CancellationToken cancellationToken = default)
    {
        return await context.QuizAttempts
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.TrialExamId.HasValue &&
                quizIds.Contains(x.TrialExamId.Value) &&
                (x.Mode == QuizMode.TrialExam || x.Mode == QuizMode.LicensedQuiz || x.Mode == QuizMode.FreeTrial))
            .GroupBy(x => x.TrialExamId!.Value)
            .Select(x => x.OrderByDescending(attempt => attempt.StartedAt).First())
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<QuizAttemptStats>> GetStatsAsync(
        IReadOnlyCollection<Guid> quizIds,
        CancellationToken cancellationToken = default)
    {
        if (quizIds.Count == 0)
        {
            return [];
        }

        var now = DateTime.UtcNow;
        var attempts = await context.QuizAttempts
            .AsNoTracking()
            .Where(x =>
                x.TrialExamId.HasValue &&
                quizIds.Contains(x.TrialExamId.Value) &&
                (x.Mode == QuizMode.TrialExam || x.Mode == QuizMode.LicensedQuiz || x.Mode == QuizMode.FreeTrial))
            .Select(x => new
            {
                QuizId = x.TrialExamId!.Value,
                x.Status,
                x.FinishedAt,
                x.StartedAt,
                x.TotalQuestions,
                x.CorrectCount
            })
            .ToListAsync(cancellationToken);

        return attempts
            .GroupBy(x => x.QuizId)
            .Select(group =>
            {
                var finishedAttempts = group
                    .Where(attempt =>
                        attempt.TotalQuestions > 0 &&
                        (attempt.Status == QuizAttemptStatus.Completed || attempt.FinishedAt.HasValue))
                    .ToList();

                var averageScore = finishedAttempts.Count == 0
                    ? 0
                    : finishedAttempts.Average(attempt => (decimal)attempt.CorrectCount / attempt.TotalQuestions * 100);

                return new QuizAttemptStats(
                    group.Key,
                    group.Count(),
                    group.Count(attempt => attempt.Status == QuizAttemptStatus.Completed || attempt.FinishedAt.HasValue),
                    group.Count(attempt =>
                        attempt.Status == QuizAttemptStatus.Expired ||
                        (!attempt.FinishedAt.HasValue && attempt.StartedAt < now.AddHours(-24))),
                    averageScore);
            })
            .ToList();
    }
}
