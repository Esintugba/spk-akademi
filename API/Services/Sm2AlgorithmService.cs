using API.Entities;

namespace API.Services;

public sealed class Sm2CalculationResult
{
    public int Repetition { get; init; }

    public decimal EaseFactor { get; init; }

    public int IntervalDays { get; init; }

    public DateTime NextReviewAt { get; init; }

    public int ConsecutiveCorrectCount { get; init; }

    public MasteryLevel MasteryLevel { get; init; }

    public decimal CorrectRate { get; init; }
}

public interface ISm2AlgorithmService
{
    Sm2CalculationResult ApplyReview(
        QuestionStudyProgress progress,
        int quality,
        bool answeredCorrect,
        int? responseTimeSeconds,
        DateTime reviewedAtUtc);

    MasteryLevel ResolveMasteryLevel(int repetition);

    int QualityFromAnswer(bool isCorrect, bool wasEasy = false);
}

public class Sm2AlgorithmService : ISm2AlgorithmService
{
    private const decimal MinEaseFactor = 1.3m;
    private const decimal InitialEaseFactor = 2.5m;

    public Sm2CalculationResult ApplyReview(
        QuestionStudyProgress progress,
        int quality,
        bool answeredCorrect,
        int? responseTimeSeconds,
        DateTime reviewedAtUtc)
    {
        quality = Math.Clamp(quality, 0, 5);

        progress.TotalReviews += 1;
        if (answeredCorrect || quality >= 3)
        {
            progress.CorrectReviews += 1;
        }

        if (responseTimeSeconds.HasValue && responseTimeSeconds.Value > 0)
        {
            var totalTime = progress.AverageResponseTimeSeconds * (progress.TotalReviews - 1) + responseTimeSeconds.Value;
            progress.AverageResponseTimeSeconds = totalTime / progress.TotalReviews;
        }

        progress.CorrectRate = progress.TotalReviews == 0
            ? 0
            : Math.Round((decimal)progress.CorrectReviews / progress.TotalReviews * 100, 1);

        if (quality < 3)
        {
            progress.Repetition = 0;
            progress.IntervalDays = 1;
            progress.ConsecutiveCorrectCount = 0;
            progress.EaseFactor = Math.Max(MinEaseFactor, progress.EaseFactor - 0.2m);
        }
        else
        {
            progress.Repetition += 1;
            progress.ConsecutiveCorrectCount += 1;
            progress.EaseFactor = CalculateEaseFactor(progress.EaseFactor, quality);
            progress.IntervalDays = CalculateIntervalDays(progress.Repetition, progress.EaseFactor, progress.IntervalDays);
        }

        progress.LastReviewedAt = reviewedAtUtc;
        progress.NextReviewAt = reviewedAtUtc.AddDays(progress.IntervalDays);
        progress.MasteryLevel = ResolveMasteryLevel(progress.Repetition);
        progress.UpdatedAt = reviewedAtUtc;

        return new Sm2CalculationResult
        {
            Repetition = progress.Repetition,
            EaseFactor = progress.EaseFactor,
            IntervalDays = progress.IntervalDays,
            NextReviewAt = progress.NextReviewAt.Value,
            ConsecutiveCorrectCount = progress.ConsecutiveCorrectCount,
            MasteryLevel = progress.MasteryLevel,
            CorrectRate = progress.CorrectRate
        };
    }

    public MasteryLevel ResolveMasteryLevel(int repetition) =>
        repetition switch
        {
            >= 10 => MasteryLevel.Mastered,
            >= 6 => MasteryLevel.Advanced,
            >= 3 => MasteryLevel.Intermediate,
            _ => MasteryLevel.Beginner
        };

    public int QualityFromAnswer(bool isCorrect, bool wasEasy = false)
    {
        if (!isCorrect)
        {
            return 1;
        }

        return wasEasy ? 5 : 4;
    }

    private static decimal CalculateEaseFactor(decimal currentEaseFactor, int quality)
    {
        var ease = currentEaseFactor + (0.1m - (5 - quality) * (0.08m + (5 - quality) * 0.02m));
        return Math.Max(MinEaseFactor, Math.Round(ease, 2));
    }

    private static int CalculateIntervalDays(int repetition, decimal easeFactor, int previousInterval)
    {
        return repetition switch
        {
            1 => 1,
            2 => 3,
            3 => 7,
            4 => 14,
            5 => 30,
            _ => Math.Max(1, (int)Math.Round(previousInterval * easeFactor))
        };
    }

    public static QuestionStudyProgress CreateInitial(string studentId, Guid questionId, DateTime utcNow) =>
        new()
        {
            StudentId = studentId,
            QuestionId = questionId,
            Repetition = 0,
            EaseFactor = InitialEaseFactor,
            IntervalDays = 1,
            NextReviewAt = utcNow,
            MasteryLevel = MasteryLevel.Beginner,
            CorrectRate = 0,
            AverageResponseTimeSeconds = 0
        };
}
