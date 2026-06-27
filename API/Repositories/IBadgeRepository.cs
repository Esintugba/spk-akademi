using API.Entities;

namespace API.Repositories;

public interface IBadgeRepository
{
    Task<IReadOnlyList<Badge>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserBadge>> GetUserBadgesAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> HasUnlockedAsync(string userId, Guid badgeId, CancellationToken cancellationToken = default);

    Task AddUserBadgeAsync(UserBadge userBadge, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
