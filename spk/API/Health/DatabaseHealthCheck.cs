using API.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace API.Health;

public class DatabaseHealthCheck(DataContext context) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext contextInfo,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await context.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("Database connection is healthy.")
                : HealthCheckResult.Unhealthy("Database connection could not be established.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database health check failed.", ex);
        }
    }
}
