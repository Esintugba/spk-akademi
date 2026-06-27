namespace API.Configuration;

public class OnboardingOptions
{
    public const string SectionName = "Onboarding";

    public string DemoLicenseName { get; set; } = "SPK Düzey 1 Demo";

    public string DemoLicenseSlug { get; set; } = "spk-duzey-1-demo";

    public int DemoDurationDays { get; set; } = 7;

    public bool AutoGrantDemoOnRegister { get; set; } = true;

    public bool CreateDemoLicenseIfMissing { get; set; } = true;

    public DemoLimitsOptions DemoLimits { get; set; } = new();
}

public class DemoLimitsOptions
{
    public int MaxQuestionsPerDay { get; set; } = 50;

    public int MaxTrialAttempts { get; set; } = 3;

    public bool ReadonlyAnalytics { get; set; } = true;

    public bool LockPremiumFeatures { get; set; } = true;
}
