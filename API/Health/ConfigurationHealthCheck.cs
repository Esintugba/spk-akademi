using API.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace API.Health;

public class ConfigurationHealthCheck(
    IConfiguration configuration,
    IHostEnvironment environment) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var errors = ConfigurationSecurityValidator.Validate(configuration, environment);

        if (errors.Count == 0)
        {
            return Task.FromResult(HealthCheckResult.Healthy("Secure configuration is valid."));
        }

        return Task.FromResult(HealthCheckResult.Unhealthy(
            "Secure configuration validation failed.",
            data: errors
                .Select((error, index) => new KeyValuePair<string, object>($"error_{index + 1}", error))
                .ToDictionary(item => item.Key, item => item.Value)));
    }
}
