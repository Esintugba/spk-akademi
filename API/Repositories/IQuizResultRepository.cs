using API.Entities;

namespace API.Repositories;

public interface IQuizResultRepository
{
    Task<QuizAttempt?> GetCompletedAttemptForResultAsync(
        Guid attemptId,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsIncompleteAttemptAsync(
        Guid attemptId,
        string? userId,
        CancellationToken cancellationToken = default);
}
