namespace API.Configuration;

public class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    public int PermitLimit { get; set; } = 120;

    public int QueueLimit { get; set; } = 0;

    public int WindowSeconds { get; set; } = 60;
}
