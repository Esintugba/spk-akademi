using API.Entities;

namespace API.Repositories;

public interface IWrongAnswerQueueRepository
{
    Task<WrongAnswerQueue?> GetByStudentAndQuestionAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WrongAnswerQueue>> GetDueItemsAsync(
        string studentId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<WrongAnswerQueue> Items, int TotalCount)> GetPagedAsync(
        string studentId,
        int page,
        int pageSize,
        bool dueOnly,
        Guid? courseId,
        Guid? topicId,
        QuestionDifficulty? difficulty,
        CancellationToken cancellationToken = default);

    Task<WrongAnswerStatsAggregate> GetStatsAggregateAsync(
        string studentId,
        DateTime utcNow,
        CancellationToken cancellationToken = default);

    Task AddAsync(WrongAnswerQueue item, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<WrongAnswerQueue> items, CancellationToken cancellationToken = default);

    Task UpdateAsync(WrongAnswerQueue item, CancellationToken cancellationToken = default);

    Task UpdateRangeAsync(IEnumerable<WrongAnswerQueue> items, CancellationToken cancellationToken = default);

    Task<bool> RemoveAsync(string studentId, Guid questionId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed class WrongAnswerStatsAggregate
{
    public int TotalWrongQuestions { get; init; }

    public int DueForReview { get; init; }

    public int MasteredQuestions { get; init; }
}
