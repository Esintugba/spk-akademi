using System.Text.RegularExpressions;

namespace API.Configuration;

public static class ConfigurationSecurityValidator
{
    private const int MinimumJwtKeyLength = 32;

    private static readonly string[] PlaceholderValues =
    [
        "change-me",
        "changeme",
        "replace-me",
        "replace-with-secure-key",
        "replace-in-production-secret-store",
        "replace-in-staging-secret-store",
        "your-secret",
        "secret",
        "password",
        "admin123",
        "123456",
        "test",
        "development-only"
    ];

    public static IReadOnlyList<string> Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        var errors = new List<string>();
        var isDevelopment = environment.IsDevelopment();
        var jwtKey = configuration["Jwt:Key"];
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var databaseProvider = configuration["Database:Provider"] ?? "Sqlite";
        var emailEnabled = configuration.GetValue<bool>("Email:Enabled");
        var seedAdminEnabled = configuration.GetValue<bool>("SeedAdmin:Enabled");
        var allowedHosts = configuration["AllowedHosts"];
        var allowedOrigins = configuration
            .GetSection($"{CorsOptions.SectionName}:AllowedOrigins")
            .Get<string[]>() ?? [];

        ValidateRequiredSecret(errors, "Jwt:Key", jwtKey, isDevelopment);
        if (!string.IsNullOrWhiteSpace(jwtKey) &&
            !isDevelopment &&
            jwtKey.Trim().Length < MinimumJwtKeyLength)
        {
            errors.Add($"Jwt:Key must be at least {MinimumJwtKeyLength} characters outside Development.");
        }

        ValidateRequiredSecret(errors, "ConnectionStrings:DefaultConnection", connectionString, isDevelopment);
        if (!isDevelopment &&
            IsPostgresProvider(databaseProvider) &&
            !ConnectionStringHasPassword(connectionString))
        {
            errors.Add("ConnectionStrings:DefaultConnection must include a non-placeholder Password for Postgres outside Development.");
        }

        if (!isDevelopment && emailEnabled)
        {
            ValidateRequiredSecret(errors, "Email:SmtpPassword", configuration["Email:SmtpPassword"], isDevelopment);
        }

        if (!isDevelopment && seedAdminEnabled)
        {
            ValidateRequiredSecret(errors, "SeedAdmin:Email", configuration["SeedAdmin:Email"], isDevelopment);
            ValidateRequiredSecret(errors, "SeedAdmin:Password", configuration["SeedAdmin:Password"], isDevelopment);
        }

        ValidateCors(errors, allowedOrigins, isDevelopment);
        ValidateAllowedHosts(errors, allowedHosts, isDevelopment);

        return errors;
    }

    public static void ThrowIfInvalid(IConfiguration configuration, IHostEnvironment environment)
    {
        var errors = Validate(configuration, environment);
        if (errors.Count > 0)
        {
            throw new InvalidOperationException("Secure configuration validation failed: " + string.Join(" ", errors));
        }
    }

    public static bool ContainsPlaceholder(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim().ToLowerInvariant();
        return PlaceholderValues.Any(placeholder => normalized.Contains(placeholder, StringComparison.Ordinal));
    }

    private static void ValidateRequiredSecret(List<string> errors, string key, string? value, bool isDevelopment)
    {
        if (isDevelopment)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{key} is required outside Development.");
            return;
        }

        if (ContainsPlaceholder(value))
        {
            errors.Add($"{key} contains a placeholder or weak default.");
        }
    }

    private static bool IsPostgresProvider(string provider)
    {
        return provider.Trim().Equals("postgres", StringComparison.OrdinalIgnoreCase) ||
            provider.Trim().Equals("postgresql", StringComparison.OrdinalIgnoreCase) ||
            provider.Trim().Equals("npgsql", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ConnectionStringHasPassword(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return false;
        }

        var match = Regex.Match(connectionString, @"(?:^|;)\s*Password\s*=\s*([^;]+)", RegexOptions.IgnoreCase);
        return match.Success && !ContainsPlaceholder(match.Groups[1].Value);
    }

    private static void ValidateCors(List<string> errors, IReadOnlyList<string> allowedOrigins, bool isDevelopment)
    {
        var configuredOrigins = allowedOrigins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim())
            .ToList();

        if (!isDevelopment && configuredOrigins.Count == 0)
        {
            errors.Add("Cors:AllowedOrigins must contain at least one explicit origin outside Development.");
            return;
        }

        foreach (var origin in configuredOrigins)
        {
            if (IsWildcardOrigin(origin))
            {
                errors.Add($"Cors:AllowedOrigins contains an unsafe wildcard origin: {origin}.");
                continue;
            }

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) ||
                string.IsNullOrWhiteSpace(uri.Host) ||
                !string.IsNullOrWhiteSpace(uri.PathAndQuery.Trim('/')))
            {
                errors.Add($"Cors:AllowedOrigins contains an invalid origin: {origin}.");
            }
        }
    }

    private static bool IsWildcardOrigin(string origin)
    {
        return origin == "*" ||
            origin.Contains('*', StringComparison.Ordinal) ||
            origin.Equals("http://*", StringComparison.OrdinalIgnoreCase) ||
            origin.Equals("https://*", StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateAllowedHosts(List<string> errors, string? allowedHosts, bool isDevelopment)
    {
        if (isDevelopment)
        {
            return;
        }

        var hosts = SplitAllowedHosts(allowedHosts);

        if (hosts.Count == 0)
        {
            errors.Add("AllowedHosts must contain at least one explicit host outside Development.");
            return;
        }

        foreach (var host in hosts)
        {
            if (host == "*" || host.Contains('*', StringComparison.Ordinal))
            {
                errors.Add($"AllowedHosts contains an unsafe wildcard host: {host}.");
                continue;
            }

            if (host.Contains("://", StringComparison.Ordinal) ||
                host.Contains('/', StringComparison.Ordinal) ||
                host.Contains('\\', StringComparison.Ordinal) ||
                Uri.CheckHostName(StripPort(host)) == UriHostNameType.Unknown)
            {
                errors.Add($"AllowedHosts contains an invalid host: {host}.");
            }
        }
    }

    private static IReadOnlyList<string> SplitAllowedHosts(string? allowedHosts)
    {
        if (string.IsNullOrWhiteSpace(allowedHosts))
        {
            return [];
        }

        return allowedHosts
            .Split([';', ','], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string StripPort(string host)
    {
        var portSeparatorIndex = host.LastIndexOf(':');
        if (portSeparatorIndex <= 0 || host.Contains(']', StringComparison.Ordinal))
        {
            return host;
        }

        return host[..portSeparatorIndex];
    }
}
