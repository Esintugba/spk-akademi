using API.Services;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace API.Health;

public class BackgroundQueueHealthCheck(BackgroundQueueMetrics metrics) : IHealthCheck
{
    private const double DegradedThreshold = 0.80;
    private const double UnhealthyThreshold = 0.95;

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var snapshots = metrics.GetSnapshots();
        var data = snapshots.ToDictionary(
            snapshot => snapshot.Name,
            snapshot => (object)new
            {
                snapshot.Capacity,
                snapshot.PendingCount,
                snapshot.EnqueuedCount,
                snapshot.ProcessedCount,
                snapshot.FailedCount,
                snapshot.AverageProcessingMilliseconds,
                snapshot.OldestPendingAt,
                UsagePercent = Math.Round(snapshot.UsageRatio * 100, 1)
            });

        if (snapshots.Any(snapshot => snapshot.UsageRatio >= UnhealthyThreshold))
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("One or more background queues are above 95% capacity.", data: data));
        }

        if (snapshots.Any(snapshot => snapshot.UsageRatio >= DegradedThreshold))
        {
            return Task.FromResult(HealthCheckResult.Degraded("One or more background queues are above 80% capacity.", data: data));
        }

        return Task.FromResult(HealthCheckResult.Healthy("Background queues are within capacity.", data: data));
    }
}
