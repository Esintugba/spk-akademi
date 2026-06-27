using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class WrongAnswerQueueRepository(DataContext context) : IWrongAnswerQueueRepository
{
    private IQueryable<WrongAnswerQueue> ActiveQueue(string studentId) =>
        context.WrongAnswerQueues
            .Where(x => x.StudentId == studentId && !x.IsMastered);

    public Task<WrongAnswerQueue?> GetByStudentAndQuestionAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default) =>
        context.WrongAnswerQueues
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.QuestionId == questionId, cancellationToken);

    public async Task<IReadOnlyList<WrongAnswerQueue>> GetDueItemsAsync(
        string studentId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        await ActiveQueue(studentId)
            .Include(x => x.Question)
                .ThenInclude(x => x!.Topic)
                    .ThenInclude(x => x!.Course)
            .Where(x => x.NextReviewAt <= asOfUtc)
            .OrderBy(x => x.NextReviewAt)
            .ToListAsync(cancellationToken);

    public async Task<(IReadOnlyList<WrongAnswerQueue> Items, int TotalCount)> GetPagedAsync(
        string studentId,
        int page,
        int pageSize,
        bool dueOnly,
        Guid? courseId,
        Guid? topicId,
        QuestionDifficulty? difficulty,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var query = context.WrongAnswerQueues
            .AsNoTracking()
            .Include(x => x.Question)
                .ThenInclude(x => x!.Topic)
                    .ThenInclude(x => x!.Course)
            .Where(x => x.StudentId == studentId);

        if (dueOnly)
        {
            query = query.Where(x => !x.IsMastered && x.NextReviewAt <= now);
        }

        if (topicId.HasValue)
        {
            query = query.Where(x => x.Question != null && x.Question.TopicId == topicId.Value);
        }
        else if (courseId.HasValue)
        {
            query = query.Where(x => x.Question != null && x.Question.Topic != null && x.Question.Topic.CourseId == courseId.Value);
        }

        if (difficulty.HasValue)
        {
            query = query.Where(x => x.Question != null && x.Question.Difficulty == difficulty.Value);
        }

        query = query.Where(x => x.Question != null && !x.Question.IsDeleted && x.Question.ReviewStatus == ReviewStatus.Approved);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.NextReviewAt)
            .ThenByDescending(x => x.LastWrongAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<WrongAnswerStatsAggregate> GetStatsAggregateAsync(
        string studentId,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        var all = context.WrongAnswerQueues.Where(x => x.StudentId == studentId);

        return new WrongAnswerStatsAggregate
        {
            TotalWrongQuestions = await all.CountAsync(cancellationToken),
            DueForReview = await all.CountAsync(x => !x.IsMastered && x.NextReviewAt <= utcNow, cancellationToken),
            MasteredQuestions = await all.CountAsync(x => x.IsMastered, cancellationToken)
        };
    }

    public async Task AddAsync(WrongAnswerQueue item, CancellationToken cancellationToken = default) =>
        await context.WrongAnswerQueues.AddAsync(item, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<WrongAnswerQueue> items, CancellationToken cancellationToken = default) =>
        await context.WrongAnswerQueues.AddRangeAsync(items, cancellationToken);

    public Task UpdateAsync(WrongAnswerQueue item, CancellationToken cancellationToken = default)
    {
        context.WrongAnswerQueues.Update(item);
        return Task.CompletedTask;
    }

    public Task UpdateRangeAsync(IEnumerable<WrongAnswerQueue> items, CancellationToken cancellationToken = default)
    {
        context.WrongAnswerQueues.UpdateRange(items);
        return Task.CompletedTask;
    }

    public async Task<bool> RemoveAsync(string studentId, Guid questionId, CancellationToken cancellationToken = default)
    {
        var item = await context.WrongAnswerQueues
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.QuestionId == questionId, cancellationToken);

        if (item is null)
        {
            return false;
        }

        context.WrongAnswerQueues.Remove(item);
        return true;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
