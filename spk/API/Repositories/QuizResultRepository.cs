using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class QuizResultRepository(DataContext context) : IQuizResultRepository
{
    public Task<QuizAttempt?> GetCompletedAttemptForResultAsync(
        Guid attemptId,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var query = context.QuizAttempts
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.TrialExam)
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
                    .ThenInclude(x => x!.License)
            .Include(x => x.Course)
                .ThenInclude(x => x!.License)
            .Include(x => x.AttemptQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Topic)
                        .ThenInclude(x => x!.Course)
            .Include(x => x.AttemptQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .Include(x => x.Answers)
            .Where(x => x.Id == attemptId && x.FinishedAt.HasValue);

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(x => x.UserId == userId);
        }

        return query.FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> ExistsIncompleteAttemptAsync(
        Guid attemptId,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var query = context.QuizAttempts
            .AsNoTracking()
            .Where(x => x.Id == attemptId && !x.FinishedAt.HasValue);

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(x => x.UserId == userId);
        }

        return query.AnyAsync(cancellationToken);
    }
}
