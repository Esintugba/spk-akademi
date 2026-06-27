using System.Collections.Concurrent;

namespace API.Services;

public static class BackgroundQueueNames
{
    public const string Import = "Import";
    public const string Contact = "Contact";
    public const string Gamification = "Gamification";
}

public record BackgroundQueueSnapshot(
    string Name,
    int Capacity,
    int PendingCount,
    long EnqueuedCount,
    long ProcessedCount,
    long FailedCount,
    double AverageProcessingMilliseconds,
    DateTime? OldestPendingAt)
{
    public double UsageRatio => Capacity <= 0 ? 0 : (double)PendingCount / Capacity;
}

public class BackgroundQueueMetrics
{
    private readonly ConcurrentDictionary<string, QueueMetricState> _states = new(StringComparer.OrdinalIgnoreCase);

    public void Register(string name, int capacity)
    {
        _states.AddOrUpdate(
            name,
            _ => new QueueMetricState(capacity),
            (_, state) =>
            {
                state.Capacity = capacity;
                return state;
            });
    }

    public int GetPendingCount(string name)
    {
        return GetState(name).PendingCount;
    }

    public void Enqueued(string name, DateTime enqueuedAt)
    {
        var state = GetState(name);
        state.PendingTimestamps.Enqueue(enqueuedAt);
        Interlocked.Increment(ref state.PendingCount);
        Interlocked.Increment(ref state.EnqueuedCount);
    }

    public DateTime? Dequeued(string name)
    {
        var state = GetState(name);
        Interlocked.Decrement(ref state.PendingCount);
        return state.PendingTimestamps.TryDequeue(out var enqueuedAt) ? enqueuedAt : null;
    }

    public void Processed(string name, TimeSpan elapsed)
    {
        var state = GetState(name);
        Interlocked.Increment(ref state.ProcessedCount);
        Interlocked.Add(ref state.TotalProcessingTicks, elapsed.Ticks);
    }

    public void Failed(string name, TimeSpan elapsed)
    {
        var state = GetState(name);
        Interlocked.Increment(ref state.FailedCount);
        Interlocked.Add(ref state.TotalProcessingTicks, elapsed.Ticks);
    }

    public IReadOnlyList<BackgroundQueueSnapshot> GetSnapshots()
    {
        return _states
            .Select(pair =>
            {
                var state = pair.Value;
                var processedTotal = Interlocked.Read(ref state.ProcessedCount) + Interlocked.Read(ref state.FailedCount);
                var totalTicks = Interlocked.Read(ref state.TotalProcessingTicks);
                var oldestPending = state.PendingTimestamps.TryPeek(out var timestamp) ? timestamp : (DateTime?)null;
                return new BackgroundQueueSnapshot(
                    pair.Key,
                    state.Capacity,
                    Math.Max(0, state.PendingCount),
                    Interlocked.Read(ref state.EnqueuedCount),
                    Interlocked.Read(ref state.ProcessedCount),
                    Interlocked.Read(ref state.FailedCount),
                    processedTotal == 0 ? 0 : TimeSpan.FromTicks(totalTicks / processedTotal).TotalMilliseconds,
                    oldestPending);
            })
            .OrderBy(x => x.Name)
            .ToList();
    }

    private QueueMetricState GetState(string name)
    {
        return _states.GetOrAdd(name, _ => new QueueMetricState(capacity: 0));
    }

    private sealed class QueueMetricState(int capacity)
    {
        public int Capacity { get; set; } = capacity;
        public int PendingCount;
        public long EnqueuedCount;
        public long ProcessedCount;
        public long FailedCount;
        public long TotalProcessingTicks;
        public ConcurrentQueue<DateTime> PendingTimestamps { get; } = new();
    }
}
