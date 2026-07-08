namespace API.Configuration;

public class DatabaseOptions
{
    public const string SectionName = "Database";

    public const string SqliteProvider = "sqlite";

    public const string PostgresProvider = "postgres";

    public const string SqlServerProvider = "sqlserver";

    public string Provider { get; set; } = "Sqlite";

    public bool AutoMigrate { get; set; } = true;

    public bool AllowProductionAutoMigrate { get; set; }

    public string SqliteMigrationsAssembly { get; set; } = "API";

    public string PostgresMigrationsAssembly { get; set; } = "API.Migrations.Postgres";

    public string SqlServerMigrationsAssembly { get; set; } = "API.Migrations.SqlServer";

    public string NormalizedProvider => NormalizeProvider(Provider);

    public string ResolveMigrationsAssembly()
    {
        return NormalizedProvider switch
        {
            SqliteProvider => SqliteMigrationsAssembly,
            PostgresProvider => PostgresMigrationsAssembly,
            SqlServerProvider => SqlServerMigrationsAssembly,
            _ => throw new InvalidOperationException($"Unsupported database provider '{Provider}'.")
        };
    }

    public static string NormalizeProvider(string? provider)
    {
        var normalized = provider?.Trim().ToLowerInvariant();

        return normalized switch
        {
            "sqlite" => SqliteProvider,
            "postgres" or "postgresql" or "npgsql" => PostgresProvider,
            "sqlserver" or "mssql" or "sql-server" => SqlServerProvider,
            _ => throw new InvalidOperationException(
                $"Unsupported database provider '{provider}'. Supported providers are Sqlite, Postgres and SqlServer.")
        };
    }

    public static bool IsPostgresProvider(string? provider)
    {
        return NormalizeProvider(provider) == PostgresProvider;
    }

    public static bool IsSqliteProvider(string? provider)
    {
        return NormalizeProvider(provider) == SqliteProvider;
    }
}
