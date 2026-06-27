using API.Dtos;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface ILeaderboardCache
{
    Task<IReadOnlyList<LeaderboardEntryDto>?> GetAsync(string cacheKey, CancellationToken cancellationToken = default);

    Task SetAsync(string cacheKey, IReadOnlyList<LeaderboardEntryDto> items, CancellationToken cancellationToken = default);

    void RemoveByPrefix(string prefix);
}

public class LeaderboardCache(IMemoryCache memoryCache, IOptions<API.Configuration.GamificationOptions> options) : ILeaderboardCache
{
    private readonly TimeSpan _duration = TimeSpan.FromMinutes(Math.Max(1, options.Value.LeaderboardCacheMinutes));

    public Task<IReadOnlyList<LeaderboardEntryDto>?> GetAsync(string cacheKey, CancellationToken cancellationToken = default)
    {
        memoryCache.TryGetValue(cacheKey, out IReadOnlyList<LeaderboardEntryDto>? items);
        return Task.FromResult(items);
    }

    public Task SetAsync(string cacheKey, IReadOnlyList<LeaderboardEntryDto> items, CancellationToken cancellationToken = default)
    {
        memoryCache.Set(cacheKey, items, _duration);
        return Task.CompletedTask;
    }

    public void RemoveByPrefix(string prefix)
    {
        // IMemoryCache does not support prefix eviction directly.
        // The service uses a stable, short TTL here; swap this implementation with Redis/IDistributedCache in production scaling scenarios.
    }
}
