using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IGamificationService
{
    Task<GamificationProfileDto> GetProfileAsync(string userId, CancellationToken cancellationToken = default);

    Task<GamificationProfileDto> ClaimDailyLoginAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DailyGoalDto>> GetDailyGoalsAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserBadgeDto>> GetBadgesAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        LeaderboardQueryDto query,
        CancellationToken cancellationToken = default);

    Task<XpHistoryResponseDto> GetXpHistoryAsync(
        string userId,
        XpHistoryQueryDto query,
        CancellationToken cancellationToken = default);
}

public class GamificationService(
    DataContext context,
    IUserGamificationRepository profileRepository,
    IDailyGoalRepository dailyGoalRepository,
    IBadgeService badgeService,
    ILeaderboardService leaderboardService,
    IXPTransactionRepository xpTransactionRepository,
    IXPService xpService,
    IMapper mapper) : IGamificationService
{
    public async Task<GamificationProfileDto> GetProfileAsync(string userId, CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetOrCreateAsync(userId, cancellationToken);
        return await BuildProfileDtoAsync(userId, profile, cancellationToken);
    }

    public async Task<GamificationProfileDto> ClaimDailyLoginAsync(string userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var (profile, _) = await xpService.TrackActivityAsync(userId, now, cancellationToken);
        await EnsureDailyGoalsAsync(userId, cancellationToken);
        await xpService.AwardXpAsync(
            userId,
            10,
            "Günlük giriş",
            "DailyLogin",
            DateOnly.FromDateTime(now).ToString(),
            cancellationToken);

        return await BuildProfileDtoAsync(userId, profile, cancellationToken);
    }

    public async Task<IReadOnlyList<DailyGoalDto>> GetDailyGoalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        await EnsureDailyGoalsAsync(userId, cancellationToken);
        var goals = await dailyGoalRepository.GetUserGoalsForDateAsync(userId, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
        return goals
            .Where(x => x.DailyGoal is not null)
            .Select(x => new DailyGoalDto(
                x.Id,
                x.DailyGoalId,
                x.DailyGoal!.Title,
                x.DailyGoal.Description,
                x.DailyGoal.GoalType,
                x.DailyGoal.TargetValue,
                x.Progress,
                x.Completed,
                x.CompletedAt,
                x.DailyGoal.XPReward,
                x.DailyGoal.ActiveDate))
            .ToList();
    }

    public Task<IReadOnlyList<UserBadgeDto>> GetBadgesAsync(string userId, CancellationToken cancellationToken = default) =>
        badgeService.GetBadgesAsync(userId, cancellationToken);

    public Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        LeaderboardQueryDto query,
        CancellationToken cancellationToken = default) =>
        leaderboardService.GetLeaderboardAsync(query.Period, query.Metric, query.Top, cancellationToken);

    public async Task<XpHistoryResponseDto> GetXpHistoryAsync(
        string userId,
        XpHistoryQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await xpTransactionRepository.GetPagedAsync(userId, query.Page, query.PageSize, cancellationToken);
        return new XpHistoryResponseDto(
            mapper.Map<IReadOnlyList<XPTransactionDto>>(items),
            query.Page,
            query.PageSize,
            totalCount);
    }

    private async Task EnsureDailyGoalsAsync(string userId, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var goals = await dailyGoalRepository.GetGoalsForDateAsync(today, cancellationToken);
        var seededGoals = CreateDailyGoalDefinitions(today);
        var existingGoalsByKey = goals.ToDictionary(x => (x.GoalType, x.TargetValue));

        foreach (var seededGoal in seededGoals)
        {
            if (!existingGoalsByKey.TryGetValue((seededGoal.GoalType, seededGoal.TargetValue), out var existingGoal))
            {
                continue;
            }

            existingGoal.Title = seededGoal.Title;
            existingGoal.Description = seededGoal.Description;
            existingGoal.XPReward = seededGoal.XPReward;
            existingGoal.ActiveDate = seededGoal.ActiveDate;
            existingGoal.UpdatedAt = DateTime.UtcNow;
        }

        var existingGoalKeys = existingGoalsByKey.Keys.ToHashSet();
        var missingGoals = seededGoals
            .Where(x => !existingGoalKeys.Contains((x.GoalType, x.TargetValue)))
            .ToList();

        if (missingGoals.Count > 0 || existingGoalsByKey.Count > 0)
        {
            await dailyGoalRepository.AddGoalsAsync(missingGoals, cancellationToken);
            try
            {
                await dailyGoalRepository.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintConflict(ex))
            {
                Detach(missingGoals);
            }

            goals = await dailyGoalRepository.GetGoalsForDateAsync(today, cancellationToken);
        }

        var userGoals = await dailyGoalRepository.GetUserGoalsForDateAsync(userId, today, cancellationToken);
        if (userGoals.Count == goals.Count)
        {
            return;
        }

        var existingGoalIds = userGoals.Select(x => x.DailyGoalId).ToHashSet();
        var missing = goals
            .Where(x => !existingGoalIds.Contains(x.Id))
            .Select(x => new UserDailyGoal
            {
                UserId = userId,
                DailyGoalId = x.Id
            })
            .ToList();

        if (missing.Count == 0)
        {
            return;
        }

        await dailyGoalRepository.AddUserGoalsAsync(missing, cancellationToken);
        try
        {
            await dailyGoalRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintConflict(ex))
        {
            Detach(missing);
        }
    }

    private async Task<GamificationProfileDto> BuildProfileDtoAsync(
        string userId,
        UserGamificationProfile profile,
        CancellationToken cancellationToken)
    {
        profile.Rank = await profileRepository.GetRankAsync(userId, cancellationToken);
        await profileRepository.SaveChangesAsync(cancellationToken);

        await EnsureDailyGoalsAsync(userId, cancellationToken);
        var allBadges = await badgeService.GetBadgesAsync(userId, cancellationToken);
        var todayGoals = await dailyGoalRepository.GetUserGoalsForDateAsync(userId, DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
        var state = GamificationMath.ResolveLevelState(profile.TotalXP);

        return new GamificationProfileDto(
            profile.Id,
            profile.UserId,
            profile.Level,
            profile.XP,
            profile.TotalXP,
            state.CurrentLevelThreshold,
            state.NextLevelThreshold,
            state.NextLevelThreshold == state.CurrentLevelThreshold
                ? 100
                : Math.Round((decimal)(profile.TotalXP - state.CurrentLevelThreshold) / (state.NextLevelThreshold - state.CurrentLevelThreshold) * 100, 1),
            profile.CurrentStreak,
            profile.LongestStreak,
            todayGoals.All(x => x.Completed) && todayGoals.Count > 0,
            profile.LastActivityAt,
            profile.Rank,
            allBadges.Count(x => x.Unlocked),
            allBadges.Count,
            todayGoals.Count(x => x.Completed));
    }

    private static IReadOnlyList<DailyGoal> CreateDailyGoalDefinitions(DateOnly today) =>
    [
        new DailyGoal
        {
            ActiveDate = today,
            Title = "20 soru çöz",
            Description = "Bugün en az 20 soru çöz.",
            GoalType = DailyGoalType.SolveQuestions,
            TargetValue = 20,
            XPReward = 40
        },
        new DailyGoal
        {
            ActiveDate = today,
            Title = "1 deneme tamamla",
            Description = "Bugün bir deneme quizini tamamla.",
            GoalType = DailyGoalType.CompleteQuiz,
            TargetValue = 1,
            XPReward = 40
        },
        new DailyGoal
        {
            ActiveDate = today,
            Title = "10 tekrar sorusu çöz",
            Description = "Yanlışlar veya tekrar oturumunda 10 soru bitir.",
            GoalType = DailyGoalType.ReviewQuestions,
            TargetValue = 10,
            XPReward = 40
        },
        new DailyGoal
        {
            ActiveDate = today,
            Title = "%80 başarı yakala",
            Description = "Bugün bir oturumda en az yüzde 80 başarı elde et.",
            GoalType = DailyGoalType.ReachAccuracy,
            TargetValue = 80,
            XPReward = 40
        }
    ];

    private void Detach(IEnumerable<object> entities)
    {
        foreach (var entity in entities)
        {
            context.Entry(entity).State = EntityState.Detached;
        }
    }

    private static bool IsUniqueConstraintConflict(DbUpdateException exception)
    {
        var message = exception.InnerException?.Message ?? exception.Message;
        return message.Contains("UNIQUE constraint failed", StringComparison.OrdinalIgnoreCase)
            || message.Contains("duplicate", StringComparison.OrdinalIgnoreCase);
    }
}
