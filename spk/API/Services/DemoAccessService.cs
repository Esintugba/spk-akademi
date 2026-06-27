using API.Configuration;
using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IDemoAccessService
{
    Task<License> EnsureDemoLicenseAsync(CancellationToken cancellationToken = default);

    Task<bool> TryGrantDemoAccessAsync(string userId, CancellationToken cancellationToken = default);

    Task<DemoAccessDto?> GetDemoAccessSummaryAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<DemoLimitsDto> GetDemoLimitsUsageAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<bool> CanStartTrialAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> HasReachedQuestionLimitAsync(string userId, CancellationToken cancellationToken = default);

    Task<bool> CanUseQuestionQuotaAsync(
        string userId,
        int requestedQuestionCount,
        CancellationToken cancellationToken = default);
}

public class DemoAccessService(
    DataContext context,
    IUserLicenseAccessRepository licenseAccessRepository,
    IOptions<OnboardingOptions> options) : IDemoAccessService
{
    private readonly OnboardingOptions _options = options.Value;

    public async Task<License> EnsureDemoLicenseAsync(CancellationToken cancellationToken = default)
    {
        var license = await context.Licenses
            .FirstOrDefaultAsync(
                x => x.Slug == _options.DemoLicenseSlug || x.Name == _options.DemoLicenseName,
                cancellationToken);

        if (license is not null)
        {
            return license;
        }

        if (!_options.CreateDemoLicenseIfMissing)
        {
            throw new InvalidOperationException(
                $"Demo lisansı bulunamadı: {_options.DemoLicenseName}");
        }

        license = new License
        {
            Name = _options.DemoLicenseName,
            Slug = _options.DemoLicenseSlug,
            Description = "Yeni kullanıcılar için otomatik 7 günlük demo erişim planı."
        };

        context.Licenses.Add(license);
        await context.SaveChangesAsync(cancellationToken);
        return license;
    }

    public async Task<bool> TryGrantDemoAccessAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (!_options.AutoGrantDemoOnRegister)
        {
            return false;
        }

        if (await licenseAccessRepository.HasActiveDemoAccessAsync(userId, cancellationToken))
        {
            return false;
        }

        if (await licenseAccessRepository.HasActiveFullAccessAsync(userId, cancellationToken))
        {
            return false;
        }

        var existingDemo = await context.UserLicenseAccesses
            .AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.IsDemoAccess, cancellationToken);

        if (existingDemo)
        {
            return false;
        }

        var license = await EnsureDemoLicenseAsync(cancellationToken);
        var expiresAt = DateTime.UtcNow.AddDays(_options.DemoDurationDays);

        await licenseAccessRepository.GrantDemoAccessAsync(
            userId,
            license.Id,
            expiresAt,
            cancellationToken);

        return true;
    }

    public async Task<DemoAccessDto?> GetDemoAccessSummaryAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var access = await licenseAccessRepository.GetActiveDemoAccessAsync(userId, cancellationToken);

        if (access?.License is null)
        {
            var expiredDemo = await context.UserLicenseAccesses
                .AsNoTracking()
                .Include(x => x.License)
                .Where(x => x.UserId == userId && x.IsDemoAccess)
                .OrderByDescending(x => x.ExpiresAt ?? x.EndDate)
                .FirstOrDefaultAsync(cancellationToken);

            if (expiredDemo?.License is null)
            {
                return null;
            }

            var expiredAt = UserLicenseAccessRules.GetEffectiveExpiresAt(expiredDemo) ?? DateTime.UtcNow;
            return new DemoAccessDto(
                expiredDemo.LicenseId,
                expiredDemo.License.Name,
                expiredAt,
                0,
                true);
        }

        var expiresAt = UserLicenseAccessRules.GetEffectiveExpiresAt(access) ?? DateTime.UtcNow;
        var daysRemaining = Math.Max(0, (int)Math.Ceiling((expiresAt - DateTime.UtcNow).TotalDays));

        return new DemoAccessDto(
            access.LicenseId,
            access.License.Name,
            expiresAt,
            daysRemaining,
            false);
    }

    public async Task<DemoLimitsDto> GetDemoLimitsUsageAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var limits = _options.DemoLimits;
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var questionsUsedToday = await context.QuizAnswers
            .AsNoTracking()
            .Where(x =>
                x.QuizAttempt!.UserId == userId &&
                x.AnsweredAt >= today &&
                x.AnsweredAt < tomorrow)
            .CountAsync(cancellationToken);

        var trialAttemptsUsed = await context.QuizAttempts
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.Mode == QuizMode.TrialExam && x.FinishedAt.HasValue)
            .CountAsync(cancellationToken);

        return new DemoLimitsDto(
            limits.MaxQuestionsPerDay,
            limits.MaxTrialAttempts,
            limits.ReadonlyAnalytics,
            limits.LockPremiumFeatures,
            questionsUsedToday,
            trialAttemptsUsed);
    }

    public async Task<bool> CanStartTrialAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (!await licenseAccessRepository.HasActiveDemoAccessAsync(userId, cancellationToken))
        {
            return true;
        }

        if (await licenseAccessRepository.HasActiveFullAccessAsync(userId, cancellationToken))
        {
            return true;
        }

        var usage = await GetDemoLimitsUsageAsync(userId, cancellationToken);
        return usage.TrialAttemptsUsed < usage.MaxTrialAttempts;
    }

    public async Task<bool> HasReachedQuestionLimitAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (!await licenseAccessRepository.HasActiveDemoAccessAsync(userId, cancellationToken))
        {
            return false;
        }

        if (await licenseAccessRepository.HasActiveFullAccessAsync(userId, cancellationToken))
        {
            return false;
        }

        var usage = await GetDemoLimitsUsageAsync(userId, cancellationToken);
        return usage.QuestionsUsedToday >= usage.MaxQuestionsPerDay;
    }

    public async Task<bool> CanUseQuestionQuotaAsync(
        string userId,
        int requestedQuestionCount,
        CancellationToken cancellationToken = default)
    {
        if (!await licenseAccessRepository.HasActiveDemoAccessAsync(userId, cancellationToken))
        {
            return true;
        }

        if (await licenseAccessRepository.HasActiveFullAccessAsync(userId, cancellationToken))
        {
            return true;
        }

        var usage = await GetDemoLimitsUsageAsync(userId, cancellationToken);
        var requested = Math.Max(0, requestedQuestionCount);
        return usage.QuestionsUsedToday + requested <= usage.MaxQuestionsPerDay;
    }
}
