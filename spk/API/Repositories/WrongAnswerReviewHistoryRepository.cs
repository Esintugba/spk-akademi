using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class WrongAnswerReviewHistoryRepository(DataContext context) : IWrongAnswerReviewHistoryRepository
{
    public async Task AddAsync(WrongAnswerReviewHistory item, CancellationToken cancellationToken = default) =>
        await context.WrongAnswerReviewHistories.AddAsync(item, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<WrongAnswerReviewHistory> items, CancellationToken cancellationToken = default) =>
        await context.WrongAnswerReviewHistories.AddRangeAsync(items, cancellationToken);

    public Task<int> CountTodayCorrectAsync(
        string studentId,
        DateTime utcTodayStart,
        CancellationToken cancellationToken = default) =>
        context.WrongAnswerReviewHistories
            .AsNoTracking()
            .CountAsync(
                x => x.StudentId == studentId && x.AnsweredCorrect && x.ReviewedAt >= utcTodayStart,
                cancellationToken);

    public async Task<(int Correct, int Total)> GetWeeklyAccuracyAsync(
        string studentId,
        DateTime weekStartUtc,
        CancellationToken cancellationToken = default)
    {
        var reviews = await context.WrongAnswerReviewHistories
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && x.ReviewedAt >= weekStartUtc)
            .Select(x => x.AnsweredCorrect)
            .ToListAsync(cancellationToken);

        return (reviews.Count(x => x), reviews.Count);
    }

    public async Task<IReadOnlyList<WeakTopicAggregate>> GetWeakTopicsAsync(
        string studentId,
        int take,
        CancellationToken cancellationToken = default)
    {
        return await context.WrongAnswerQueues
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && !x.IsMastered)
            .Include(x => x.Question)
                .ThenInclude(x => x!.Topic)
                    .ThenInclude(x => x!.Course)
            .Where(x => x.Question != null && x.Question.Topic != null)
            .GroupBy(x => new
            {
                x.Question!.TopicId,
                TopicTitle = x.Question.Topic!.Title,
                CourseName = x.Question.Topic.Course!.Name
            })
            .Select(g => new WeakTopicAggregate
            {
                TopicId = g.Key.TopicId,
                TopicTitle = g.Key.TopicTitle,
                CourseName = g.Key.CourseName,
                WrongCount = g.Sum(x => x.WrongCount),
                CorrectCount = g.Sum(x => x.ReviewCount),
                TotalReviews = g.Count()
            })
            .OrderByDescending(x => x.WrongCount)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> HasAnyForStudentAsync(string studentId, CancellationToken cancellationToken = default) =>
        context.WrongAnswerReviewHistories
            .AsNoTracking()
            .AnyAsync(x => x.StudentId == studentId, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
