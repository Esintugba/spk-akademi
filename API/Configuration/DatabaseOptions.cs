namespace API.Configuration;

public class DatabaseOptions
{
    public const string SectionName = "Database";

    public string Provider { get; set; } = "Sqlite";

    public bool AutoMigrate { get; set; } = true;
}
