using System.Threading.Channels;

namespace API.Services;

public interface IImportJobQueue
{
    ValueTask EnqueueAsync(Guid jobId, CancellationToken cancellationToken = default);
}

public class ImportJobQueue(
    Channel<Guid> channel,
    IServiceScopeFactory scopeFactory,
    BackgroundQueueMetrics metrics,
    ILogger<ImportJobQueue> logger) : BackgroundService, IImportJobQueue
{
    public async ValueTask EnqueueAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        LogIfQueueNearCapacity();
        await channel.Writer.WriteAsync(jobId, cancellationToken);
        metrics.Enqueued(BackgroundQueueNames.Import, DateTime.UtcNow);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var jobId in channel.Reader.ReadAllAsync(stoppingToken))
        {
            metrics.Dequeued(BackgroundQueueNames.Import);
            var startedAt = DateTime.UtcNow;
            try
            {
                using var scope = scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IQuestionImportService>();
                await processor.ProcessJobAsync(jobId, stoppingToken);
                metrics.Processed(BackgroundQueueNames.Import, DateTime.UtcNow - startedAt);
            }
            catch (Exception ex)
            {
                metrics.Failed(BackgroundQueueNames.Import, DateTime.UtcNow - startedAt);
                logger.LogError(ex, "Import job {JobId} failed in background worker.", jobId);
            }
        }
    }

    private void LogIfQueueNearCapacity()
    {
        var snapshot = metrics.GetSnapshots().FirstOrDefault(x => x.Name == BackgroundQueueNames.Import);
        if (snapshot is not null && snapshot.UsageRatio >= 0.95)
        {
            logger.LogWarning(
                "Import queue is near capacity: {PendingCount}/{Capacity}. Producer will wait if the queue is full.",
                snapshot.PendingCount,
                snapshot.Capacity);
        }
    }
}
