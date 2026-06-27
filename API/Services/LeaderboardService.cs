using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public interface ILeaderboardService
{
    Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        LeaderboardPeriod period,
        LeaderboardMetric metric,
        int take,
        CancellationToken cancellationToken = default);
}

public class LeaderboardService(
    IUserGamificationRepository repository,
    ILeaderboardCache cache) : ILeaderboardService
{
    public async Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        LeaderboardPeriod period,
        LeaderboardMetric metric,
        int take,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"leaderboard:{period}:{metric}:{take}";
        var cached = await cache.GetAsync(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var items = await repository.GetLeaderboardAsync(period, metric, take, cancellationToken);
        await cache.SetAsync(cacheKey, items, cancellationToken);
        return items;
    }
}
