namespace API.Configuration;

public class GamificationOptions
{
    public const string SectionName = "Gamification";

    public int DailyXpCap { get; set; } = 500;

    public int LeaderboardCacheMinutes { get; set; } = 5;
}
