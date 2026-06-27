namespace API.Configuration;

public class EmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; }

    public string FromAddress { get; set; } = "noreply@spkakademi.local";

    public string FromName { get; set; } = "SPK Akademi";

    public string AdminNotificationAddress { get; set; } = "destek@spkakademi.com";

    public string? SmtpHost { get; set; }

    public int SmtpPort { get; set; } = 587;

    public string? SmtpUser { get; set; }

    public string? SmtpPassword { get; set; }

    public bool UseSsl { get; set; } = true;
}
