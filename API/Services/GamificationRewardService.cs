using API.Entities;
using API.Repositories;

namespace API.Services;

public interface IGamificationRewardService
{
    Task<IReadOnlyList<UserBadge>> ApplyQuizCompletionAsync(
        QuizCompletedEvent domainEvent,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserBadge>> ApplyReviewCompletionAsync(
        ReviewCompletedEvent domainEvent,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserBadge>> ApplyAdaptiveTaskCompletionAsync(
        AdaptiveStudyTaskCompletedEvent domainEvent,
        CancellationToken cancellationToken = default);
}

public class GamificationRewardService(
    IDailyGoalRepository dailyGoalRepository,
    IXPService xpService,
    IBadgeService badgeService) : IGamificationRewardService
{
    public async Task<IReadOnlyList<UserBadge>> ApplyQuizCompletionAsync(
        QuizCompletedEvent domainEvent,
        CancellationToken cancellationToken = default)
    {
        var activity = await xpService.TrackActivityAsync(domainEvent.UserId, domainEvent.CompletedAt, cancellationToken);
        await AwardStreakRewardAsync(domainEvent.UserId, activity.Profile.CurrentStreak, cancellationToken);

        var quizKey = domainEvent.QuizId?.ToString() ?? domainEvent.AttemptId.ToString();
        var dateKey = DateOnly.FromDateTime(domainEvent.CompletedAt).ToString();
        await xpService.AwardXpAsync(domainEvent.UserId, 25, "Quiz tamamlama", "QuizCompletion", $"{quizKey}:{dateKey}", cancellationToken);

        if (domainEvent.Accuracy >= 90)
        {
            await xpService.AwardXpAsync(domainEvent.UserId, 50, "Yüzde 90+ başarı", "QuizAccuracy90", $"{quizKey}:{dateKey}", cancellationToken);
        }

        await ProgressDailyGoalsAsync(domainEvent.UserId, DailyGoalType.SolveQuestions, domainEvent.TotalQuestions, domainEvent.CompletedAt, cancellationToken);
        await ProgressDailyGoalsAsync(domainEvent.UserId, DailyGoalType.CompleteQuiz, 1, domainEvent.CompletedAt, cancellationToken);

        if (domainEvent.Accuracy >= 80)
        {
            await ProgressDailyGoalsAsync(domainEvent.UserId, DailyGoalType.ReachAccuracy, (int)Math.Round(domainEvent.Accuracy), domainEvent.CompletedAt, cancellationToken);
        }

        return await EvaluateBadgesUntilStableAsync(domainEvent.UserId, cancellationToken);
    }

    public async Task<IReadOnlyList<UserBadge>> ApplyReviewCompletionAsync(
        ReviewCompletedEvent domainEvent,
        CancellationToken cancellationToken = default)
    {
        var activity = await xpService.TrackActivityAsync(domainEvent.UserId, domainEvent.CompletedAt, cancellationToken);
        await AwardStreakRewardAsync(domainEvent.UserId, activity.Profile.CurrentStreak, cancellationToken);

        await xpService.AwardXpAsync(
            domainEvent.UserId,
            15,
            "Yanlış cevap tekrarı",
            "ReviewCompletion",
            domainEvent.SessionId.ToString(),
            cancellationToken);

        await ProgressDailyGoalsAsync(
            domainEvent.UserId,
            DailyGoalType.ReviewQuestions,
            domainEvent.ReviewedQuestionCount,
            domainEvent.CompletedAt,
            cancellationToken);

        return await EvaluateBadgesUntilStableAsync(domainEvent.UserId, cancellationToken);
    }

    public async Task<IReadOnlyList<UserBadge>> ApplyAdaptiveTaskCompletionAsync(
        AdaptiveStudyTaskCompletedEvent domainEvent,
        CancellationToken cancellationToken = default)
    {
        var activity = await xpService.TrackActivityAsync(domainEvent.UserId, domainEvent.CompletedAt, cancellationToken);
        await AwardStreakRewardAsync(domainEvent.UserId, activity.Profile.CurrentStreak, cancellationToken);

        var xpAmount = domainEvent.TaskType switch
        {
            AdaptiveStudyTaskType.Review => 12,
            AdaptiveStudyTaskType.TopicStudy => 15,
            AdaptiveStudyTaskType.Quiz => 18,
            AdaptiveStudyTaskType.WrongAnswerAnalysis => 15,
            _ => 10
        };

        await xpService.AwardXpAsync(
            domainEvent.UserId,
            xpAmount,
            "Uyarlanabilir plan görevi",
            "AdaptiveStudyTaskCompletion",
            domainEvent.TaskId.ToString(),
            cancellationToken);

        if (domainEvent.TaskType == AdaptiveStudyTaskType.Review)
        {
            await ProgressDailyGoalsAsync(
                domainEvent.UserId,
                DailyGoalType.ReviewQuestions,
                Math.Max(1, domainEvent.ActualQuestions),
                domainEvent.CompletedAt,
                cancellationToken);
        }

        if (domainEvent.TaskType is AdaptiveStudyTaskType.Quiz or AdaptiveStudyTaskType.WrongAnswerAnalysis)
        {
            await ProgressDailyGoalsAsync(
                domainEvent.UserId,
                DailyGoalType.SolveQuestions,
                Math.Max(1, domainEvent.ActualQuestions),
                domainEvent.CompletedAt,
                cancellationToken);
        }

        if (domainEvent.TaskType == AdaptiveStudyTaskType.Quiz)
        {
            await ProgressDailyGoalsAsync(
                domainEvent.UserId,
                DailyGoalType.CompleteQuiz,
                1,
                domainEvent.CompletedAt,
                cancellationToken);
        }

        return await EvaluateBadgesUntilStableAsync(domainEvent.UserId, cancellationToken);
    }

    private async Task AwardStreakRewardAsync(
        string userId,
        int currentStreak,
        CancellationToken cancellationToken)
    {
        if (currentStreak > 0 && currentStreak % 7 == 0)
        {
            await xpService.AwardXpAsync(
                userId,
                100,
                "7 günlük seri",
                "StreakReward",
                currentStreak.ToString(),
                cancellationToken);
        }
    }

    private async Task ProgressDailyGoalsAsync(
        string userId,
        DailyGoalType goalType,
        int increment,
        DateTime completedAt,
        CancellationToken cancellationToken)
    {
        var goals = await dailyGoalRepository.GetUserGoalsForDateAsync(userId, DateOnly.FromDateTime(completedAt), cancellationToken);
        foreach (var goal in goals.Where(x => x.DailyGoal?.GoalType == goalType))
        {
            if (goal.Completed || goal.DailyGoal is null)
            {
                continue;
            }

            goal.Progress = goalType == DailyGoalType.ReachAccuracy
                ? Math.Max(goal.Progress, increment)
                : goal.Progress + increment;

            if (goal.Progress < goal.DailyGoal.TargetValue)
            {
                continue;
            }

            goal.Completed = true;
            goal.CompletedAt = completedAt;

            await xpService.AwardXpAsync(
                userId,
                goal.DailyGoal.XPReward,
                "Günlük hedef tamamlama",
                "DailyGoalCompletion",
                goal.Id.ToString(),
                cancellationToken);
        }

        await dailyGoalRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<UserBadge>> EvaluateBadgesUntilStableAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var allUnlocked = new List<UserBadge>();

        for (var i = 0; i < 3; i++)
        {
            var unlocked = await badgeService.EvaluateAndUnlockAsync(userId, cancellationToken);
            if (unlocked.Count == 0)
            {
                break;
            }

            allUnlocked.AddRange(unlocked);
        }

        return allUnlocked;
    }
}
