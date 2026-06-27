using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class BadgeRepository(DataContext context) : IBadgeRepository
{
    public async Task<IReadOnlyList<Badge>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await context.Badges
            .AsNoTracking()
            .OrderBy(x => x.Category)
            .ThenBy(x => x.RequirementValue)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<UserBadge>> GetUserBadgesAsync(string userId, CancellationToken cancellationToken = default) =>
        await context.UserBadges
            .AsNoTracking()
            .Include(x => x.Badge)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.UnlockedAt)
            .ToListAsync(cancellationToken);

    public Task<bool> HasUnlockedAsync(string userId, Guid badgeId, CancellationToken cancellationToken = default) =>
        context.UserBadges.AnyAsync(x => x.UserId == userId && x.BadgeId == badgeId, cancellationToken);

    public Task AddUserBadgeAsync(UserBadge userBadge, CancellationToken cancellationToken = default) =>
        context.UserBadges.AddAsync(userBadge, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
