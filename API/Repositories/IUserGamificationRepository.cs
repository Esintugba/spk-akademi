using API.Dtos;
using API.Entities;

namespace API.Repositories;

public interface IUserGamificationRepository
{
    Task<UserGamificationProfile> GetOrCreateAsync(string userId, CancellationToken cancellationToken = default);

    Task<UserGamificationProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    Task<int> GetRankAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LeaderboardEntryDto>> GetLeaderboardAsync(
        LeaderboardPeriod period,
        LeaderboardMetric metric,
        int take,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
