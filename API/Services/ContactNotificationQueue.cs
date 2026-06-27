using System.Threading.Channels;

namespace API.Services;

public record ContactEmailNotification(string ToEmail, string Subject, string Body);

public interface IContactNotificationQueue
{
    ValueTask EnqueueAsync(ContactEmailNotification notification, CancellationToken cancellationToken = default);
}

public class ContactNotificationQueue(
    Channel<ContactEmailNotification> channel,
    IServiceScopeFactory scopeFactory,
    BackgroundQueueMetrics metrics,
    ILogger<ContactNotificationQueue> logger) : BackgroundService, IContactNotificationQueue
{
    public async ValueTask EnqueueAsync(ContactEmailNotification notification, CancellationToken cancellationToken = default)
    {
        LogIfQueueNearCapacity();
        await channel.Writer.WriteAsync(notification, cancellationToken);
        metrics.Enqueued(BackgroundQueueNames.Contact, DateTime.UtcNow);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var notification in channel.Reader.ReadAllAsync(stoppingToken))
        {
            metrics.Dequeued(BackgroundQueueNames.Contact);
            var startedAt = DateTime.UtcNow;
            try
            {
                using var scope = scopeFactory.CreateScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailNotificationService>();
                await emailService.SendAsync(
                    notification.ToEmail,
                    notification.Subject,
                    notification.Body,
                    stoppingToken);
                metrics.Processed(BackgroundQueueNames.Contact, DateTime.UtcNow - startedAt);
            }
            catch (Exception ex)
            {
                metrics.Failed(BackgroundQueueNames.Contact, DateTime.UtcNow - startedAt);
                logger.LogError(ex, "Contact notification email could not be sent to {ToEmail}.", notification.ToEmail);
            }
        }
    }

    private void LogIfQueueNearCapacity()
    {
        var snapshot = metrics.GetSnapshots().FirstOrDefault(x => x.Name == BackgroundQueueNames.Contact);
        if (snapshot is not null && snapshot.UsageRatio >= 0.95)
        {
            logger.LogWarning(
                "Contact notification queue is near capacity: {PendingCount}/{Capacity}. Producer will wait if the queue is full.",
                snapshot.PendingCount,
                snapshot.Capacity);
        }
    }
}
