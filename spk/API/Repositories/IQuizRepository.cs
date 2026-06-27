using API.Entities;

namespace API.Repositories;

public record QuizAttemptStats(
    Guid QuizId,
    int AttemptCount,
    int CompletedCount,
    int AbandonedCount,
    decimal AverageScore);

public interface IQuizRepository
{
    IQueryable<TrialExam> QueryPublishedQuizzes(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        IReadOnlyCollection<Guid> purchasedQuizIds);

    Task<TrialExam?> GetPublishedQuizAsync(
        Guid quizId,
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        IReadOnlyCollection<Guid> purchasedQuizIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuizAttempt>> GetLatestAttemptsAsync(
        string userId,
        IReadOnlyCollection<Guid> quizIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuizAttemptStats>> GetStatsAsync(
        IReadOnlyCollection<Guid> quizIds,
        CancellationToken cancellationToken = default);
}
