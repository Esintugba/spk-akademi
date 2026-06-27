using API.Entities;

namespace API.Repositories;

public interface IWrongAnswerReviewHistoryRepository
{
    Task AddAsync(WrongAnswerReviewHistory item, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<WrongAnswerReviewHistory> items, CancellationToken cancellationToken = default);

    Task<int> CountTodayCorrectAsync(string studentId, DateTime utcTodayStart, CancellationToken cancellationToken = default);

    Task<(int Correct, int Total)> GetWeeklyAccuracyAsync(
        string studentId,
        DateTime weekStartUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WeakTopicAggregate>> GetWeakTopicsAsync(
        string studentId,
        int take,
        CancellationToken cancellationToken = default);

    Task<bool> HasAnyForStudentAsync(string studentId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed class WeakTopicAggregate
{
    public Guid TopicId { get; init; }

    public string TopicTitle { get; init; } = string.Empty;

    public string CourseName { get; init; } = string.Empty;

    public int WrongCount { get; init; }

    public int CorrectCount { get; init; }

    public int TotalReviews { get; init; }
}
