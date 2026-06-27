using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IReviewSessionRepository
{
    Task<ReviewSession?> GetActiveByIdAsync(
        Guid sessionId,
        string studentId,
        CancellationToken cancellationToken = default);

    Task<ReviewSession?> GetWithAnswersAsync(
        Guid sessionId,
        string studentId,
        CancellationToken cancellationToken = default);

    Task<bool> HasAnswerForQuestionAsync(
        Guid sessionId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<int> CountCompletedDaysStreakAsync(
        string studentId,
        CancellationToken cancellationToken = default);

    Task<decimal> GetRetentionRateAsync(
        string studentId,
        CancellationToken cancellationToken = default);

    void Add(ReviewSession session);

    void AddAnswers(IEnumerable<ReviewSessionAnswer> answers);

    Task SaveAsync(CancellationToken cancellationToken = default);
}

public class ReviewSessionRepository(DataContext context) : IReviewSessionRepository
{
    public Task<ReviewSession?> GetActiveByIdAsync(
        Guid sessionId,
        string studentId,
        CancellationToken cancellationToken = default) =>
        context.ReviewSessions
            .FirstOrDefaultAsync(x =>
                x.Id == sessionId
                && x.StudentId == studentId
                && x.CompletedAt == null,
                cancellationToken);

    public Task<ReviewSession?> GetWithAnswersAsync(
        Guid sessionId,
        string studentId,
        CancellationToken cancellationToken = default) =>
        context.ReviewSessions
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.StudentId == studentId, cancellationToken);

    public Task<bool> HasAnswerForQuestionAsync(
        Guid sessionId,
        Guid questionId,
        CancellationToken cancellationToken = default) =>
        context.ReviewSessionAnswers
            .AnyAsync(x => x.ReviewSessionId == sessionId && x.QuestionId == questionId, cancellationToken);

    public async Task<int> CountCompletedDaysStreakAsync(
        string studentId,
        CancellationToken cancellationToken = default)
    {
        var completedDates = await context.ReviewSessions
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && x.CompletedAt != null)
            .Select(x => x.CompletedAt!.Value.Date)
            .Distinct()
            .OrderByDescending(x => x)
            .ToListAsync(cancellationToken);

        return CalculateStreak(completedDates);
    }

    public async Task<decimal> GetRetentionRateAsync(
        string studentId,
        CancellationToken cancellationToken = default)
    {
        var answers = await context.ReviewSessionAnswers
            .AsNoTracking()
            .Where(x => x.ReviewSession != null && x.ReviewSession.StudentId == studentId)
            .Select(x => x.Quality)
            .ToListAsync(cancellationToken);

        if (answers.Count == 0)
        {
            return 0;
        }

        return Math.Round((decimal)answers.Count(q => q >= 3) / answers.Count * 100, 1);
    }

    public void Add(ReviewSession session) => context.ReviewSessions.Add(session);

    public void AddAnswers(IEnumerable<ReviewSessionAnswer> answers) =>
        context.ReviewSessionAnswers.AddRange(answers);

    public Task SaveAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);

    private static int CalculateStreak(List<DateTime> completedDates)
    {
        if (completedDates.Count == 0)
        {
            return 0;
        }

        var streak = 0;
        var cursor = DateTime.UtcNow.Date;

        foreach (var date in completedDates)
        {
            if (date == cursor || date == cursor.AddDays(-1) && streak == 0)
            {
                streak++;
                cursor = date.AddDays(-1);
            }
            else if (streak > 0 && date == cursor)
            {
                streak++;
                cursor = date.AddDays(-1);
            }
            else if (streak == 0 && date == DateTime.UtcNow.Date)
            {
                streak = 1;
                cursor = date.AddDays(-1);
            }
            else
            {
                break;
            }
        }

        return streak;
    }
}
