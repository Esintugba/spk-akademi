using System.Text.RegularExpressions;

namespace API.Configuration;

public static class ConfigurationSecurityValidator
{
    private const int MinimumJwtKeyLength = 32;
    private const int MinimumJwtKeyBytes = 32;
    private const double MinimumJwtEntropyBits = 128;

    private const string RetiredSourceControlledJwtKeySha256 =
        "64c9520e68d9c5ab63c68783dfcea9f273e2e6a6733d0dec6f1bbf9b533b5955";

    private static readonly string[] PlaceholderValues =
    [
        "__set_via_environment__",
        "set-via-environment",
        "set_via_environment",
        "change-me",
        "changeme",
        "replace-me",
        "replace-with",
        "replace-with-secure-key",
        "replace-in-production-secret-store",
        "replace-in-staging-secret-store",
        "your-secret",
        "secret",
        "password",
        "public",
        "example",
        "sample",
        "demo",
        "default",
        "admin123",
        "123456",
        "test",
        "development-only"
    ];

    private static readonly string[] WeakJwtTerms =
    [
        "spkakademi",
        "spkacademy",
        "supersecret",
        "jwtkey",
        "jwtsecret",
        "localdev",
        "devsecret",
        "prodsecret",
        "productionsecret",
        "localhost",
        "development",
        "staging",
        "production",
        "default"
    ];

    public static IReadOnlyList<string> Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        var errors = new List<string>();
        var isDevelopment = environment.IsDevelopment();
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        var forwardedHeadersOptions = configuration
            .GetSection(ForwardedHeadersConfigurationOptions.SectionName)
            .Get<ForwardedHeadersConfigurationOptions>() ?? new ForwardedHeadersConfigurationOptions();
        var authCookieOptions = configuration.GetSection(AuthCookieOptions.SectionName).Get<AuthCookieOptions>() ?? new AuthCookieOptions();
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var databaseProvider = configuration["Database:Provider"] ?? "Sqlite";
        var autoMigrate = configuration.GetValue<bool>("Database:AutoMigrate");
        var allowProductionAutoMigrate = configuration.GetValue<bool>("Database:AllowProductionAutoMigrate");
        var emailEnabled = configuration.GetValue<bool>("Email:Enabled");
        var seedAdminEnabled = configuration.GetValue<bool>("SeedAdmin:Enabled");
        var aiQuestionGenerationEnabled = configuration.GetValue<bool>("AiQuestionGeneration:Enabled");
        var allowedHosts = configuration["AllowedHosts"];
        var allowedOrigins = configuration
            .GetSection($"{CorsOptions.SectionName}:AllowedOrigins")
            .Get<string[]>() ?? [];

        ValidateJwtOptions(errors, jwtOptions, isDevelopment);

        string? normalizedDatabaseProvider = null;
        try
        {
            normalizedDatabaseProvider = DatabaseOptions.NormalizeProvider(databaseProvider);
        }
        catch (InvalidOperationException exception)
        {
            errors.Add(exception.Message);
        }

        ValidateRequiredSecret(errors, "ConnectionStrings:DefaultConnection", connectionString, isDevelopment);
        if (!isDevelopment &&
            normalizedDatabaseProvider == DatabaseOptions.PostgresProvider &&
            !ConnectionStringHasPassword(connectionString))
        {
            errors.Add("ConnectionStrings:DefaultConnection must include a non-placeholder Password for Postgres outside Development.");
        }

        if (!isDevelopment && autoMigrate && !allowProductionAutoMigrate)
        {
            errors.Add("Database:AutoMigrate cannot be true outside Development unless Database:AllowProductionAutoMigrate is explicitly true.");
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

        if (aiQuestionGenerationEnabled)
        {
            ValidateRequiredSecret(
                errors,
                "AiQuestionGeneration:ApiKey",
                configuration["AiQuestionGeneration:ApiKey"],
                isDevelopment);
        }

        ValidateCors(errors, allowedOrigins, isDevelopment);
        ValidateAllowedHosts(errors, allowedHosts, isDevelopment);
        ValidateForwardedHeaders(errors, forwardedHeadersOptions, isDevelopment);
        ValidateAuthCookies(errors, authCookieOptions, isDevelopment);

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

    private static void ValidateJwtOptions(List<string> errors, JwtOptions jwtOptions, bool isDevelopment)
    {
        ValidateJwtKey(errors, "Jwt:Key", jwtOptions.Key, isDevelopment, required: true);

        var currentKey = jwtOptions.Key.Trim();
        var previousKeys = jwtOptions.PreviousKeys
            .Where(key => !string.IsNullOrWhiteSpace(key))
            .Select(key => key.Trim())
            .ToArray();

        for (var i = 0; i < previousKeys.Length; i++)
        {
            ValidateJwtKey(errors, $"Jwt:PreviousKeys:{i}", previousKeys[i], isDevelopment, required: false);

            if (!string.IsNullOrWhiteSpace(currentKey) &&
                FixedTimeEquals(currentKey, previousKeys[i]))
            {
                errors.Add($"Jwt:PreviousKeys:{i} must not be the same value as Jwt:Key.");
            }
        }

        var duplicatePreviousKey = previousKeys
            .GroupBy(key => key)
            .FirstOrDefault(group => group.Count() > 1);

        if (duplicatePreviousKey is not null)
        {
            errors.Add("Jwt:PreviousKeys contains duplicate signing keys.");
        }

        if (jwtOptions.AccessTokenMinutes <= 0 || jwtOptions.AccessTokenMinutes > 1440)
        {
            errors.Add("Jwt:AccessTokenMinutes must be between 1 and 1440.");
        }

        if (jwtOptions.RefreshTokenDays <= 0 || jwtOptions.RefreshTokenDays > 90)
        {
            errors.Add("Jwt:RefreshTokenDays must be between 1 and 90.");
        }
    }

    private static void ValidateJwtKey(
        List<string> errors,
        string keyName,
        string? value,
        bool isDevelopment,
        bool required)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            if (required)
            {
                errors.Add($"{keyName} is required. Use User Secrets in Development and an environment variable or secret manager outside Development.");
            }

            return;
        }

        var trimmed = value.Trim();

        if (FixedTimeEquals(ComputeSha256Hex(trimmed), RetiredSourceControlledJwtKeySha256))
        {
            errors.Add($"{keyName} uses a retired source-controlled JWT key and must be rotated immediately.");
        }

        if (ContainsPlaceholder(trimmed) || ContainsWeakJwtTerm(trimmed))
        {
            errors.Add($"{keyName} contains a placeholder, public, demo, test, default, or predictable value.");
        }

        if (trimmed.Length < MinimumJwtKeyLength)
        {
            errors.Add($"{keyName} must be at least {MinimumJwtKeyLength} characters.");
        }

        var byteLength = System.Text.Encoding.UTF8.GetByteCount(trimmed);
        if (byteLength < MinimumJwtKeyBytes)
        {
            errors.Add($"{keyName} must contain at least {MinimumJwtKeyBytes} UTF-8 bytes for HMAC SHA256.");
        }

        if (!isDevelopment)
        {
            var estimatedEntropyBits = EstimateShannonEntropyBits(trimmed);
            if (estimatedEntropyBits < MinimumJwtEntropyBits)
            {
                errors.Add($"{keyName} has low estimated entropy. Use at least 32 cryptographically random bytes encoded as Base64 or 64 random hex characters.");
            }

            if (IsPredictableJwtKey(trimmed))
            {
                errors.Add($"{keyName} looks predictable. Use a cryptographically random key from a secret manager.");
            }
        }
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

        if (!key.StartsWith("ConnectionStrings:", StringComparison.OrdinalIgnoreCase) &&
            ContainsPlaceholder(value))
        {
            errors.Add($"{key} contains a placeholder or weak default.");
        }
    }

    private static bool ContainsWeakJwtTerm(string value)
    {
        var normalized = Regex.Replace(value.ToLowerInvariant(), "[^a-z0-9]", string.Empty);
        return WeakJwtTerms.Any(term => normalized.Contains(term, StringComparison.Ordinal));
    }

    private static bool IsPredictableJwtKey(string value)
    {
        if (Guid.TryParse(value, out _))
        {
            return true;
        }

        if (value.Distinct().Count() < 12)
        {
            return true;
        }

        if (Regex.IsMatch(value, @"(.)\1{7,}"))
        {
            return true;
        }

        return Regex.IsMatch(
            value,
            "(012345|123456|234567|345678|456789|abcdef|qwerty|letmein|password)",
            RegexOptions.IgnoreCase);
    }

    private static double EstimateShannonEntropyBits(string value)
    {
        var length = value.Length;
        if (length == 0)
        {
            return 0;
        }

        var entropyPerCharacter = value
            .GroupBy(character => character)
            .Select(group =>
            {
                var probability = (double)group.Count() / length;
                return -probability * Math.Log(probability, 2);
            })
            .Sum();

        return entropyPerCharacter * length;
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        return System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(left),
            System.Text.Encoding.UTF8.GetBytes(right));
    }

    private static string ComputeSha256Hex(string value)
    {
        var hash = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(hash).ToLowerInvariant();
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

    private static void ValidateForwardedHeaders(
        List<string> errors,
        ForwardedHeadersConfigurationOptions options,
        bool isDevelopment)
    {
        var knownProxies = options.KnownProxies
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .ToArray();
        var knownNetworks = options.KnownNetworks
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .ToArray();

        if (options.ForwardLimit <= 0 || options.ForwardLimit > 5)
        {
            errors.Add("ForwardedHeaders:ForwardLimit must be between 1 and 5.");
        }

        foreach (var proxy in knownProxies)
        {
            if (!System.Net.IPAddress.TryParse(proxy, out _))
            {
                errors.Add($"ForwardedHeaders:KnownProxies contains an invalid IP address: {proxy}.");
            }
        }

        foreach (var network in knownNetworks)
        {
            if (!TryParseIPNetwork(network))
            {
                errors.Add($"ForwardedHeaders:KnownNetworks contains an invalid CIDR network: {network}.");
            }
        }

        if (isDevelopment || !options.Enabled)
        {
            return;
        }

        if (knownProxies.Length == 0 && knownNetworks.Length == 0)
        {
            errors.Add("ForwardedHeaders is enabled outside Development, but no KnownProxies or KnownNetworks are configured. Refusing to trust forwarded headers from every remote address.");
        }
    }

    private static void ValidateAuthCookies(List<string> errors, AuthCookieOptions options, bool isDevelopment)
    {
        if (string.IsNullOrWhiteSpace(options.RefreshTokenCookieName))
        {
            errors.Add("AuthCookies:RefreshTokenCookieName is required.");
        }

        if (string.IsNullOrWhiteSpace(options.AntiforgeryCookieName))
        {
            errors.Add("AuthCookies:AntiforgeryCookieName is required.");
        }

        if (string.IsNullOrWhiteSpace(options.Path) || !options.Path.StartsWith('/'))
        {
            errors.Add("AuthCookies:Path must start with '/'.");
        }

        if (!isDevelopment && !options.Secure)
        {
            errors.Add("AuthCookies:Secure must be true outside Development.");
        }

        if (!isDevelopment && options.SameSite == SameSiteMode.None)
        {
            errors.Add("AuthCookies:SameSite=None is not allowed outside Development unless a cross-site frontend architecture is explicitly designed and reviewed.");
        }

        ValidateHostPrefixedCookie(errors, "AuthCookies:RefreshTokenCookieName", options.RefreshTokenCookieName, options);
        ValidateHostPrefixedCookie(errors, "AuthCookies:AntiforgeryCookieName", options.AntiforgeryCookieName, options);
    }

    private static void ValidateHostPrefixedCookie(
        List<string> errors,
        string keyName,
        string cookieName,
        AuthCookieOptions options)
    {
        if (!cookieName.StartsWith("__Host-", StringComparison.Ordinal))
        {
            return;
        }

        if (!options.Secure)
        {
            errors.Add($"{keyName} uses the __Host- prefix, so AuthCookies:Secure must be true.");
        }

        if (options.Path != "/")
        {
            errors.Add($"{keyName} uses the __Host- prefix, so AuthCookies:Path must be '/'.");
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

    private static bool TryParseIPNetwork(string value)
    {
        var parts = value.Split('/', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length != 2 ||
            !System.Net.IPAddress.TryParse(parts[0], out var prefix) ||
            !int.TryParse(parts[1], out var prefixLength))
        {
            return false;
        }

        var maxPrefixLength = prefix.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? 32 : 128;
        if (prefixLength < 0 || prefixLength > maxPrefixLength)
        {
            return false;
        }

        return true;
    }
}
