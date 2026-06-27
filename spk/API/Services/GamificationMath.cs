namespace API.Services;

public static class GamificationMath
{
    public static int GetLevelThreshold(int level)
    {
        if (level <= 0)
        {
            return 0;
        }

        return (int)Math.Round(100 * Math.Pow(level, 1.5));
    }

    public static (int Level, int CurrentXp, int CurrentLevelThreshold, int NextLevelThreshold) ResolveLevelState(int totalXp)
    {
        var level = 1;
        var consumed = 0;

        while (true)
        {
            var nextCost = GetLevelThreshold(level);
            if (totalXp < consumed + nextCost)
            {
                return (level, totalXp - consumed, consumed, consumed + nextCost);
            }

            consumed += nextCost;
            level++;
        }
    }
}
