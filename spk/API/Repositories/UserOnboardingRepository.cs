using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IUserOnboardingRepository
{
    Task<UserOnboardingState?> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<UserOnboardingState> GetOrCreateAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class UserOnboardingRepository(DataContext context) : IUserOnboardingRepository
{
    public Task<UserOnboardingState?> GetByUserIdAsync(
        string userId,
        CancellationToken cancellationToken = default) =>
        context.UserOnboardingStates
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

    public async Task<UserOnboardingState> GetOrCreateAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var existing = await context.UserOnboardingStates
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var created = new UserOnboardingState
        {
            UserId = userId,
            HasSeenWelcome = false,
            CurrentStep = 0
        };

        context.UserOnboardingStates.Add(created);
        await context.SaveChangesAsync(cancellationToken);
        return created;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
