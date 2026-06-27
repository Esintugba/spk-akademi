using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IQuizSessionResolverService
{
    Task<QuizSessionDto?> ResolveQuizAttemptAsync(
        Guid attemptId,
        string? userId,
        bool touchActivity,
        CancellationToken cancellationToken = default);

    Task<QuizSessionDto?> ResolveReviewSessionAsync(
        Guid sessionId,
        string studentId,
        bool touchActivity,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ActiveQuizAttemptDto>> GetActiveSessionsAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<bool> TryExpireIfNeededAsync(QuizAttempt attempt, CancellationToken cancellationToken = default);
}

public class QuizSessionResolverService(
    DataContext context,
    IQuizAttemptRepository quizAttemptRepository,
    IQuizRoutingService routingService) : IQuizSessionResolverService
{
    public async Task<QuizSessionDto?> ResolveQuizAttemptAsync(
        Guid attemptId,
        string? userId,
        bool touchActivity,
        CancellationToken cancellationToken = default)
    {
        var attempt = await quizAttemptRepository.GetByIdForSessionAsync(attemptId, cancellationToken);
        if (attempt is null)
        {
            return null;
        }

        if (!CanAccessAttempt(attempt, userId))
        {
            return null;
        }

        if (attempt.AttemptQuestions.Any(x => x.Question is { IsDeleted: true }))
        {
            return null;
        }

        await TryExpireIfNeededAsync(attempt, cancellationToken);

        if (touchActivity && attempt.Status is QuizAttemptStatus.Started or QuizAttemptStatus.InProgress)
        {
            attempt.LastActivityAt = DateTime.UtcNow;
            attempt.Status = QuizAttemptStatus.InProgress;
            attempt.UpdatedAt = DateTime.UtcNow;
            await quizAttemptRepository.SaveChangesAsync(cancellationToken);
        }

        var effectiveMode = routingService.ResolveEffectiveMode(attempt, attempt.TrialExam);
        var timeout = routingService.GetSessionTimeout(effectiveMode, attempt.TrialExam?.DurationMinutes);
        var expiresAt = attempt.StartedAt.Add(timeout);
        var remaining = attempt.Status == QuizAttemptStatus.Expired
            ? 0
            : (int)Math.Max(0, (expiresAt - DateTime.UtcNow).TotalSeconds);

        var canResume = attempt.Status is QuizAttemptStatus.Started or QuizAttemptStatus.InProgress
            && !attempt.FinishedAt.HasValue
            && remaining > 0;

        return new QuizSessionDto(
            attempt.Id,
            effectiveMode,
            attempt.Status,
            routingService.BuildRoute(effectiveMode, attempt.Id),
            remaining,
            canResume,
            attempt.StartedAt,
            attempt.LastActivityAt ?? attempt.StartedAt,
            expiresAt,
            attempt.TrialExam?.Title ?? BuildPracticeTitle(attempt));
    }

    public async Task<QuizSessionDto?> ResolveReviewSessionAsync(
        Guid sessionId,
        string studentId,
        bool touchActivity,
        CancellationToken cancellationToken = default)
    {
        var session = await context.ReviewSessions
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.StudentId == studentId, cancellationToken);

        if (session is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        if (session.CompletedAt.HasValue)
        {
            return new QuizSessionDto(
                session.Id,
                QuizMode.ReviewSession,
                QuizAttemptStatus.Completed,
                routingService.BuildReviewSessionRoute(session.Id),
                0,
                false,
                session.StartedAt,
                session.UpdatedAt ?? session.StartedAt,
                session.ExpiresAt,
                "Tekrar oturumu");
        }

        if (session.ExpiresAt < now)
        {
            return new QuizSessionDto(
                session.Id,
                QuizMode.ReviewSession,
                QuizAttemptStatus.Expired,
                routingService.BuildReviewSessionRoute(session.Id),
                0,
                false,
                session.StartedAt,
                session.UpdatedAt ?? session.StartedAt,
                session.ExpiresAt,
                "Tekrar oturumu");
        }

        if (touchActivity)
        {
            session.UpdatedAt = now;
            await context.SaveChangesAsync(cancellationToken);
        }

        var remaining = (int)Math.Max(0, (session.ExpiresAt - now).TotalSeconds);

        return new QuizSessionDto(
            session.Id,
            QuizMode.ReviewSession,
            QuizAttemptStatus.InProgress,
            routingService.BuildReviewSessionRoute(session.Id),
            remaining,
            true,
            session.StartedAt,
            session.UpdatedAt ?? session.StartedAt,
            session.ExpiresAt,
            "Tekrar oturumu");
    }

    public async Task<IReadOnlyList<ActiveQuizAttemptDto>> GetActiveSessionsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var attempts = await quizAttemptRepository.GetActiveAttemptsAsync(userId, cancellationToken);
        var result = new List<ActiveQuizAttemptDto>();

        foreach (var attempt in attempts)
        {
            await TryExpireIfNeededAsync(attempt, cancellationToken);

            if (attempt.Status is not (QuizAttemptStatus.Started or QuizAttemptStatus.InProgress) || attempt.FinishedAt.HasValue)
            {
                continue;
            }

            var effectiveMode = routingService.ResolveEffectiveMode(attempt, attempt.TrialExam);
            var timeout = routingService.GetSessionTimeout(effectiveMode, attempt.TrialExam?.DurationMinutes);
            var expiresAt = attempt.StartedAt.Add(timeout);
            var remaining = (int)Math.Max(0, (expiresAt - DateTime.UtcNow).TotalSeconds);

            if (remaining <= 0)
            {
                continue;
            }

            result.Add(new ActiveQuizAttemptDto(
                attempt.Id,
                effectiveMode,
                attempt.Status,
                routingService.BuildRoute(effectiveMode, attempt.Id),
                remaining,
                attempt.StartedAt,
                attempt.LastActivityAt ?? attempt.StartedAt,
                attempt.TrialExam?.Title ?? BuildPracticeTitle(attempt)));
        }

        return result
            .OrderByDescending(x => x.LastActivityAt)
            .ToList();
    }

    public async Task<bool> TryExpireIfNeededAsync(QuizAttempt attempt, CancellationToken cancellationToken = default)
    {
        if (attempt.FinishedAt.HasValue || attempt.Status == QuizAttemptStatus.Completed)
        {
            return false;
        }

        var effectiveMode = routingService.ResolveEffectiveMode(attempt, attempt.TrialExam);
        var timeout = routingService.GetSessionTimeout(effectiveMode, attempt.TrialExam?.DurationMinutes);
        var expiresAt = attempt.StartedAt.Add(timeout);

        if (DateTime.UtcNow <= expiresAt)
        {
            return false;
        }

        attempt.Status = QuizAttemptStatus.Expired;
        attempt.FinishedAt = DateTime.UtcNow;
        attempt.UpdatedAt = DateTime.UtcNow;
        await quizAttemptRepository.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static bool CanAccessAttempt(QuizAttempt attempt, string? userId)
    {
        if (string.IsNullOrWhiteSpace(attempt.UserId))
        {
            return attempt.TrialExamId.HasValue;
        }

        return attempt.UserId == userId;
    }

    private static string BuildPracticeTitle(QuizAttempt attempt) =>
        attempt.Mode switch
        {
            QuizMode.CoursePractice => "Ders pratiği",
            QuizMode.WrongAnswers => "Yanlışlarım tekrarı",
            QuizMode.TopicPractice => "Konu pratiği",
            QuizMode.MixedPractice => "Karma pratik",
            QuizMode.MockExam => "Mock sınav",
            _ => "Quiz oturumu"
        };
}
