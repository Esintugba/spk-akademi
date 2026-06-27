namespace API.Dtos;

public record DemoAccessDto(
    Guid Id,
    string Name,
    DateTime ExpiresAt,
    int DaysRemaining,
    bool IsExpired);

public record DemoLimitsDto(
    int MaxQuestionsPerDay,
    int MaxTrialAttempts,
    bool ReadonlyAnalytics,
    bool LockPremiumFeatures,
    int QuestionsUsedToday,
    int TrialAttemptsUsed);

public record UserOnboardingStateDto(
    bool HasSeenWelcome,
    DateTime? CompletedAt,
    int CurrentStep,
    bool IsCompleted);

public record OnboardingStatusDto(
    bool HasActiveAccess,
    bool HasDemoAccess,
    bool HasFullAccess,
    DemoAccessDto? DemoPlan,
    bool ShowOnboarding,
    bool OnboardingCompleted,
    string SupportEmail,
    string WelcomeMessage,
    DemoLimitsDto DemoLimits,
    UserOnboardingStateDto? OnboardingState);

public record CompleteOnboardingDto(int? CurrentStep);
