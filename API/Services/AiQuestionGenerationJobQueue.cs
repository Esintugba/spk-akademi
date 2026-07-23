using System.Threading.Channels;
using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IAiQuestionGenerationJobQueue
{
    ValueTask EnqueueAsync(Guid jobId, CancellationToken cancellationToken = default);
}

public class AiQuestionGenerationJobQueue(
    Channel<AiQuestionGenerationQueueItem> channel,
    IServiceScopeFactory scopeFactory,
    BackgroundQueueMetrics metrics,
    ILogger<AiQuestionGenerationJobQueue> logger)
    : BackgroundService, IAiQuestionGenerationJobQueue
{
    public async ValueTask EnqueueAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        await channel.Writer.WriteAsync(new AiQuestionGenerationQueueItem(jobId), cancellationToken);
        metrics.Enqueued(BackgroundQueueNames.AiQuestionGeneration, DateTime.UtcNow);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecoverInterruptedJobsAsync(stoppingToken);

        await foreach (var item in channel.Reader.ReadAllAsync(stoppingToken))
        {
            metrics.Dequeued(BackgroundQueueNames.AiQuestionGeneration);
            var startedAt = DateTime.UtcNow;
            try
            {
                using var scope = scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IAiQuestionGenerationService>();
                await processor.ProcessJobAsync(item.JobId, stoppingToken);
                metrics.Processed(
                    BackgroundQueueNames.AiQuestionGeneration,
                    DateTime.UtcNow - startedAt);
            }
            catch (Exception exception)
            {
                metrics.Failed(
                    BackgroundQueueNames.AiQuestionGeneration,
                    DateTime.UtcNow - startedAt);
                logger.LogError(
                    exception,
                    "AI question generation job {JobId} failed in background worker.",
                    item.JobId);
            }
        }
    }

    private async Task RecoverInterruptedJobsAsync(CancellationToken cancellationToken)
    {
        List<Guid> jobIds;
        using (var scope = scopeFactory.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<DataContext>();
            var jobs = await context.AiQuestionGenerationJobs
                .Where(job =>
                    job.Status == AiQuestionGenerationJobStatus.Pending ||
                    job.Status == AiQuestionGenerationJobStatus.Processing)
                .OrderBy(job => job.CreatedAt)
                .ToListAsync(cancellationToken);

            foreach (var job in jobs.Where(job => job.Status == AiQuestionGenerationJobStatus.Processing))
            {
                job.Status = AiQuestionGenerationJobStatus.Pending;
                job.StartedAt = null;
                job.ErrorMessage = null;
            }

            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync(cancellationToken);
            }

            jobIds = jobs.Select(job => job.Id).ToList();
        }

        foreach (var jobId in jobIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            using var scope = scopeFactory.CreateScope();
            var processor = scope.ServiceProvider.GetRequiredService<IAiQuestionGenerationService>();
            await processor.ProcessJobAsync(jobId, cancellationToken);
        }
    }
}

public readonly record struct AiQuestionGenerationQueueItem(Guid JobId);
