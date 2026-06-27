namespace API.Configuration;

public class SeedAdminOptions
{
    public const string SectionName = "SeedAdmin";

    public bool Enabled { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string DisplayName { get; set; } = "System Admin";
}
