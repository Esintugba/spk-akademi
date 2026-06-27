namespace API.Configuration;

public class BrandingOptions
{
    public const string SectionName = "Branding";

    public string AppName { get; set; } = "SPK Akademi";

    public string SupportEmail { get; set; } = "destek@spkakademi.com";

    public string ApiTitle { get; set; } = "SPK Akademi API";
}
