namespace API.Configuration;

public class BackgroundQueueOptions
{
    public const string SectionName = "BackgroundQueues";

    public int ImportCapacity { get; set; } = 100;

    public int ContactCapacity { get; set; } = 500;
}
