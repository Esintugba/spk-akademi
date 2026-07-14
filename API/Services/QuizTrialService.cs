using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum TrialStartError
{
    None,
    NotFound,
    Forbidden,
    NoQuestions,
    DemoLimitReached
}

public sealed class TrialStartOutcome
{
    public TrialStartError Error { get; init; }

    public QuizAttemptResponseDto? Response { get; init; }

    public static TrialStartOutcome Success(QuizAttemptResponseDto response) =>
        new() { Error = TrialStartError.None, Response = response };

    public static TrialStartOutcome Fail(TrialStartError error) =>
        new() { Error = error };
}

public interface IQuizTrialService
{
    Task<TrialStartOutcome> StartLicensedTrialAsync(
        string userId,
        Guid quizId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentAccessibleTrialDto>> GetAccessibleTrialsAsync(
        string userId,
        CancellationToken cancellationToken = default);
}

public class QuizTrialService(
    ITrialExamRepository trialExamRepository,
    IStudentLicenseRepository studentLicenseRepository,
    IQuizAttemptRepository quizAttemptRepository,
    IDemoAccessService demoAccessService,
    IQuizGenerationService quizGenerationService) : IQuizTrialService
{
    public async Task<TrialStartOutcome> StartLicensedTrialAsync(
        string userId,
        Guid quizId,
        CancellationToken cancellationToken = default)
    {
        var trialExam = await trialExamRepository.GetActiveTrialForStartAsync(quizId, cancellationToken);

        if (trialExam is null)
        {
            return TrialStartOutcome.Fail(TrialStartError.NotFound);
        }

        if (!await HasTrialAccessAsync(userId, trialExam, cancellationToken))
        {
            return TrialStartOutcome.Fail(TrialStartError.Forbidden);
        }

        var existingAttempt = await quizAttemptRepository.GetUnfinishedTrialAttemptAsync(
            userId,
            quizId,
            cancellationToken);

        if (existingAttempt is not null)
        {
            if (IsAttemptExpired(existingAttempt, trialExam.DurationMinutes))
            {
                existingAttempt.Status = QuizAttemptStatus.Expired;
                existingAttempt.FinishedAt = DateTime.UtcNow;
                existingAttempt.UpdatedAt = DateTime.UtcNow;
                await quizAttemptRepository.SaveChangesAsync(cancellationToken);
            }
            else
            {
                existingAttempt.Status = QuizAttemptStatus.InProgress;
                existingAttempt.LastActivityAt = DateTime.UtcNow;
                existingAttempt.UpdatedAt = DateTime.UtcNow;
                await quizAttemptRepository.SaveChangesAsync(cancellationToken);
                return TrialStartOutcome.Success(ToResponse(existingAttempt));
            }
        }

        if (!await demoAccessService.CanStartTrialAsync(userId, cancellationToken))
        {
            return TrialStartOutcome.Fail(TrialStartError.DemoLimitReached);
        }

        var selectedQuestions = trialExam.Questions
            .OrderBy(x => x.Order)
            .Select(x => x.Question)
            .Where(x => x is not null)
            .Select(x => x!)
            .Where(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.Approved)
            .Take(trialExam.QuestionCount)
            .ToList();

        if (selectedQuestions.Count < trialExam.QuestionCount)
        {
            return TrialStartOutcome.Fail(TrialStartError.NoQuestions);
        }

        var attempt = await quizGenerationService.CreateAttemptAsync(
            new QuizGenerationRequest
            {
                UserId = userId,
                Mode = QuizMode.LicensedQuiz,
                TrialExamId = trialExam.Id,
                Questions = selectedQuestions
            },
            cancellationToken);

        attempt.TrialExam = trialExam;
        return TrialStartOutcome.Success(ToResponse(attempt));
    }

    public async Task<IReadOnlyList<StudentAccessibleTrialDto>> GetAccessibleTrialsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var licenseIds = await studentLicenseRepository.GetActiveLicenseIdsAsync(userId, cancellationToken);
        var purchasedTrialIds = await trialExamRepository.GetPurchasedTrialIdsAsync(userId, cancellationToken);
        var trials = await trialExamRepository.GetAccessibleTrialsAsync(
            userId,
            licenseIds,
            purchasedTrialIds,
            cancellationToken);

        var result = new List<StudentAccessibleTrialDto>();

        foreach (var trial in trials)
        {
            var latestAttempt = await quizAttemptRepository.GetLatestAttemptAsync(
                userId,
                trial.Id,
                cancellationToken);

            var progressStatus = StudentTrialProgressStatus.NotStarted;
            Guid? activeAttemptId = null;
            int? remainingTimeSeconds = null;

            if (latestAttempt is not null)
            {
                if (latestAttempt.FinishedAt.HasValue ||
                    latestAttempt.Status is QuizAttemptStatus.Completed or QuizAttemptStatus.Expired)
                {
                    progressStatus = StudentTrialProgressStatus.Completed;
                }
                else if (IsAttemptExpired(latestAttempt, trial.DurationMinutes))
                {
                    progressStatus = StudentTrialProgressStatus.Completed;
                }
                else
                {
                    progressStatus = StudentTrialProgressStatus.InProgress;
                    activeAttemptId = latestAttempt.Id;
                    remainingTimeSeconds = CalculateRemainingSeconds(latestAttempt, trial.DurationMinutes);
                }
            }

            decimal? lastSuccessRate = null;
            if (latestAttempt?.FinishedAt is not null && latestAttempt.TotalQuestions > 0)
            {
                lastSuccessRate = Math.Round(
                    (decimal)latestAttempt.CorrectCount / latestAttempt.TotalQuestions * 100,
                    1);
            }

            result.Add(new StudentAccessibleTrialDto(
                trial.Id,
                trial.Title,
                trial.License?.Name,
                trial.LicenseId,
                trial.DurationMinutes,
                trial.QuestionCount,
                trial.IsFree,
                progressStatus,
                activeAttemptId,
                remainingTimeSeconds,
                latestAttempt?.StartedAt,
                lastSuccessRate));
        }

        return result;
    }

    private async Task<bool> HasTrialAccessAsync(
        string userId,
        TrialExam trialExam,
        CancellationToken cancellationToken)
    {
        if (trialExam.IsFree)
        {
            return true;
        }

        if (trialExam.LicenseId.HasValue &&
            await studentLicenseRepository.HasActiveLicenseAccessAsync(
                userId,
                trialExam.LicenseId.Value,
                cancellationToken))
        {
            return true;
        }

        return await trialExamRepository.HasActivePurchaseAsync(userId, trialExam.Id, cancellationToken);
    }

    private static bool IsAttemptExpired(QuizAttempt attempt, int durationMinutes)
    {
        var expiresAt = attempt.StartedAt.AddMinutes(durationMinutes);
        return DateTime.UtcNow > expiresAt;
    }

    private static int CalculateRemainingSeconds(QuizAttempt attempt, int durationMinutes)
    {
        var expiresAt = attempt.StartedAt.AddMinutes(durationMinutes);
        var remaining = (int)Math.Max(0, (expiresAt - DateTime.UtcNow).TotalSeconds);
        return remaining;
    }

    private static QuizAttemptResponseDto ToResponse(QuizAttempt attempt)
    {
        var remainingTime = attempt.TrialExam is null || attempt.FinishedAt.HasValue
            ? 0
            : CalculateRemainingSeconds(attempt, attempt.TrialExam.DurationMinutes);

        var status = attempt.FinishedAt.HasValue || attempt.Status == QuizAttemptStatus.Completed
            ? QuizAttemptStatus.Completed
            : remainingTime == 0 && attempt.TrialExam is not null
                ? QuizAttemptStatus.Expired
                : attempt.Status is QuizAttemptStatus.NotStarted
                    ? QuizAttemptStatus.Started
                    : attempt.Status;

        return new QuizAttemptResponseDto(
            attempt.Id,
            attempt.TrialExamId ?? Guid.Empty,
            attempt.StartedAt,
            remainingTime,
            status);
    }
}
