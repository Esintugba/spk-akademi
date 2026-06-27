using API.Configuration;
using API.Data;
using API.Entities;
using API.Repositories;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IXPService
{
    Task<int> AwardXpAsync(
        string userId,
        int amount,
        string reason,
        string referenceType,
        string? referenceId,
        CancellationToken cancellationToken = default);

    Task<(UserGamificationProfile Profile, bool LevelChanged)> TrackActivityAsync(
        string userId,
        DateTime activityAt,
        CancellationToken cancellationToken = default);
}

public class XPService(
    IUserGamificationRepository profileRepository,
    IXPTransactionRepository xpTransactionRepository,
    IOptions<GamificationOptions> options) : IXPService
{
    public async Task<int> AwardXpAsync(
        string userId,
        int amount,
        string reason,
        string referenceType,
        string? referenceId,
        CancellationToken cancellationToken = default)
    {
        if (amount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "XP negatif olamaz.");
        }

        if (amount == 0)
        {
            return 0;
        }

        if (await xpTransactionRepository.HasReferenceAwardedAsync(userId, referenceType, referenceId, cancellationToken))
        {
            return 0;
        }

        var earnedToday = await xpTransactionRepository.GetDailyEarnedXpAsync(userId, DateTime.UtcNow, cancellationToken);
        var remainingCap = Math.Max(0, options.Value.DailyXpCap - earnedToday);
        var granted = Math.Min(amount, remainingCap);
        if (granted <= 0)
        {
            return 0;
        }

        var profile = await profileRepository.GetOrCreateAsync(userId, cancellationToken);
        var previousLevel = profile.Level;

        profile.TotalXP += granted;
        ApplyLevelState(profile);
        profile.UpdatedAt = DateTime.UtcNow;

        await xpTransactionRepository.AddAsync(new XPTransaction
        {
            UserId = userId,
            Amount = granted,
            Reason = reason,
            ReferenceType = referenceType,
            ReferenceId = referenceId
        }, cancellationToken);

        await xpTransactionRepository.SaveChangesAsync(cancellationToken);

        if (profile.Level != previousLevel)
        {
            profile.UpdatedAt = DateTime.UtcNow;
            await profileRepository.SaveChangesAsync(cancellationToken);
        }

        return granted;
    }

    public async Task<(UserGamificationProfile Profile, bool LevelChanged)> TrackActivityAsync(
        string userId,
        DateTime activityAt,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetOrCreateAsync(userId, cancellationToken);
        var previousLevel = profile.Level;

        var today = DateOnly.FromDateTime(activityAt);
        var previousDay = today.AddDays(-1);
        var previousActivityDay = profile.LastActivityAt.HasValue
            ? DateOnly.FromDateTime(profile.LastActivityAt.Value)
            : (DateOnly?)null;

        if (previousActivityDay is null || previousActivityDay < previousDay)
        {
            profile.CurrentStreak = 1;
        }
        else if (previousActivityDay == previousDay)
        {
            profile.CurrentStreak += 1;
        }

        profile.LongestStreak = Math.Max(profile.LongestStreak, profile.CurrentStreak);
        profile.LastActivityAt = activityAt;
        profile.DailyGoalCompleted = false;
        ApplyLevelState(profile);
        profile.UpdatedAt = DateTime.UtcNow;

        await profileRepository.SaveChangesAsync(cancellationToken);
        return (profile, profile.Level != previousLevel);
    }

    private static void ApplyLevelState(UserGamificationProfile profile)
    {
        var state = GamificationMath.ResolveLevelState(profile.TotalXP);
        profile.Level = state.Level;
        profile.XP = state.CurrentXp;
    }
}
