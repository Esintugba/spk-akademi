using API.Configuration;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IOnboardingService
{
    Task InitializeNewStudentAsync(string userId, CancellationToken cancellationToken = default);

    Task<OnboardingStatusDto> GetStatusAsync(string userId, CancellationToken cancellationToken = default);

    Task<OnboardingStatusDto> CompleteOnboardingAsync(
        string userId,
        int? currentStep,
        CancellationToken cancellationToken = default);
}

public class OnboardingService(
    IUserOnboardingRepository onboardingRepository,
    IUserLicenseAccessRepository licenseAccessRepository,
    IDemoAccessService demoAccessService,
    IOptions<OnboardingOptions> options,
    IOptions<BrandingOptions> brandingOptions) : IOnboardingService
{
    private readonly OnboardingOptions _options = options.Value;
    private readonly BrandingOptions _branding = brandingOptions.Value;

    public async Task InitializeNewStudentAsync(string userId, CancellationToken cancellationToken = default)
    {
        await onboardingRepository.GetOrCreateAsync(userId, cancellationToken);
        await demoAccessService.TryGrantDemoAccessAsync(userId, cancellationToken);
    }

    public async Task<OnboardingStatusDto> GetStatusAsync(string userId, CancellationToken cancellationToken = default)
    {
        await licenseAccessRepository.DeactivateExpiredForUserAsync(userId, cancellationToken);

        var onboarding = await onboardingRepository.GetOrCreateAsync(userId, cancellationToken);
        var hasFullAccess = await licenseAccessRepository.HasActiveFullAccessAsync(userId, cancellationToken);
        var demoSummary = await demoAccessService.GetDemoAccessSummaryAsync(userId, cancellationToken);
        var hasDemoAccess = demoSummary is not null && !demoSummary.IsExpired;
        var hasActiveAccess = hasFullAccess || hasDemoAccess;
        var demoLimits = await demoAccessService.GetDemoLimitsUsageAsync(userId, cancellationToken);
        var onboardingCompleted = onboarding.CompletedAt.HasValue;

        var showOnboarding = !onboardingCompleted && !hasFullAccess;

        var welcomeMessage = BuildWelcomeMessage(hasFullAccess, hasDemoAccess, demoSummary);

        return new OnboardingStatusDto(
            hasActiveAccess,
            hasDemoAccess,
            hasFullAccess,
            hasDemoAccess ? demoSummary : demoSummary?.IsExpired == true ? demoSummary : null,
            showOnboarding,
            onboardingCompleted,
            _branding.SupportEmail,
            welcomeMessage,
            demoLimits,
            new UserOnboardingStateDto(
                onboarding.HasSeenWelcome,
                onboarding.CompletedAt,
                onboarding.CurrentStep,
                onboardingCompleted));
    }

    public async Task<OnboardingStatusDto> CompleteOnboardingAsync(
        string userId,
        int? currentStep,
        CancellationToken cancellationToken = default)
    {
        var onboarding = await onboardingRepository.GetOrCreateAsync(userId, cancellationToken);
        var now = DateTime.UtcNow;

        onboarding.HasSeenWelcome = true;
        onboarding.CompletedAt = now;
        onboarding.CurrentStep = currentStep ?? Math.Max(onboarding.CurrentStep, 3);
        onboarding.UpdatedAt = now;

        await onboardingRepository.SaveChangesAsync(cancellationToken);

        return await GetStatusAsync(userId, cancellationToken);
    }

    private string BuildWelcomeMessage(bool hasFullAccess, bool hasDemoAccess, DemoAccessDto? demo)
    {
        if (hasFullAccess)
        {
            return "Erişiminiz aktif. SPK Akademi çalışma paneline hoş geldiniz.";
        }

        if (hasDemoAccess && demo is not null)
        {
            return $"""
                Erişiminiz henüz aktif değil.
                Bu süreçte platformu keşfedebilmeniz için size {_options.DemoDurationDays} günlük {demo.Name} erişimi tanımlandı.
                Sorularınız için {_branding.SupportEmail} adresine ulaşabilirsiniz.
                """;
        }

        if (demo?.IsExpired == true)
        {
            return """
                Demo süreniz sona erdi.
                Tam erişim için erişim talebi oluşturabilirsiniz.
                """;
        }

        return $"""
            Erişiminiz henüz aktif değil.
            Tam erişim için erişim talebi oluşturabilir veya {_branding.SupportEmail} üzerinden destek alabilirsiniz.
            """;
    }
}
