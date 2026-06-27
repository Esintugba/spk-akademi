namespace API.Configuration;

public class ContactOptions
{
    public const string SectionName = "Contact";

    public bool RequireCaptcha { get; set; }

    public string CaptchaProvider { get; set; } = "recaptcha";

    public string? CaptchaSecret { get; set; }

    public string? CaptchaVerifyUrl { get; set; }

    public int MaxRecentMessagesPerIp { get; set; } = 5;

    public int IpThrottleWindowMinutes { get; set; } = 15;

    public int DuplicateWindowHours { get; set; } = 24;
}
