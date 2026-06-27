using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class UserGamificationRepository(DataContext context) : IUserGamificationRepository
{
    public async Task<UserGamificationProfile> GetOrCreateAsync(string userId, CancellationToken cancellationToken = default)
    {
        var profile = await context.UserGamificationProfiles
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (profile is not null)
        {
            return profile;
        }

        profile = new UserGamificationProfile
        {
            UserId = userId
        };

        await context.UserGamificationProfiles.AddAsync(profile, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return profile;
    }

    public Task<UserGamificationProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        context.UserGamificationProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

    public async Task<int> GetRankAsync(string userId, CancellationToken cancellationToken = default)
    {
        var profile = await context.UserGamificationProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (profile is null)
        {
            return 0;
        }

        return await context.UserGamificationProfiles
            .AsNoTracking()
            .CountAsync(
                x => x.TotalXP > profile.TotalXP || (x.TotalXP == profile.TotalXP && x.CreatedAt < profile.CreatedAt),
                cancellationToken) + 1;
    }

    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        LeaderboardPeriod period,
        LeaderboardMetric metric,
        int take,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var rangeStart = period switch
        {
            LeaderboardPeriod.Daily => now.Date,
            LeaderboardPeriod.Weekly => now.Date.AddDays(-6),
            LeaderboardPeriod.Monthly => now.Date.AddDays(-29),
            _ => DateTime.MinValue
        };

        var users = context.Users.AsNoTracking();
        var profiles = context.UserGamificationProfiles.AsNoTracking();
        var attempts = context.QuizAttempts.AsNoTracking().Where(x => x.FinishedAt.HasValue && x.Status == QuizAttemptStatus.Completed);
        var xpTransactions = context.XPTransactions.AsNoTracking();

        if (period != LeaderboardPeriod.Global)
        {
            attempts = attempts.Where(x => x.FinishedAt >= rangeStart);
            xpTransactions = xpTransactions.Where(x => x.CreatedAt >= rangeStart);
        }

        var leaderboard = await (
            from profile in profiles
            join user in users on profile.UserId equals user.Id
            select new
            {
                profile.UserId,
                user.DisplayName,
                profile.Level,
                profile.TotalXP,
                profile.CurrentStreak,
                Accuracy = attempts
                    .Where(x => x.UserId == profile.UserId)
                    .Average(x => x.TotalQuestions == 0 ? 0m : (decimal?)x.CorrectCount / x.TotalQuestions * 100) ?? 0m,
                SolvedQuestions = attempts
                    .Where(x => x.UserId == profile.UserId)
                    .Sum(x => (int?)x.TotalQuestions) ?? 0,
                PeriodXp = xpTransactions
                    .Where(x => x.UserId == profile.UserId)
                    .Sum(x => (int?)x.Amount) ?? 0
            })
            .ToListAsync(cancellationToken);

        var ordered = leaderboard
            .Select(item => new
            {
                item.UserId,
                item.DisplayName,
                item.Level,
                item.TotalXP,
                item.CurrentStreak,
                Accuracy = Math.Round(item.Accuracy, 1),
                item.SolvedQuestions,
                MetricValue = metric switch
                {
                    LeaderboardMetric.Streak => item.CurrentStreak,
                    LeaderboardMetric.Accuracy => item.Accuracy,
                    LeaderboardMetric.SolvedQuestions => item.SolvedQuestions,
                    _ => period == LeaderboardPeriod.Global ? item.TotalXP : item.PeriodXp
                }
            })
            .OrderByDescending(x => x.MetricValue)
            .ThenByDescending(x => x.TotalXP)
            .ThenBy(x => x.DisplayName)
            .Take(take)
            .Select((item, index) => new LeaderboardEntryDto(
                index + 1,
                item.UserId,
                item.DisplayName,
                item.Level,
                item.TotalXP,
                item.CurrentStreak,
                Math.Round(item.Accuracy, 1),
                item.SolvedQuestions,
                Math.Round(Convert.ToDecimal(item.MetricValue), 1)))
            .ToList();

        return ordered;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
