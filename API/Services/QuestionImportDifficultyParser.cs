using API.Entities;

namespace API.Services;

public static class QuestionImportDifficultyParser
{
    public static QuestionDifficulty ParseOrDefault(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return QuestionDifficulty.Medium;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "kolay" or "kolay seviye" => QuestionDifficulty.Easy,
            "orta" or "orta seviye" => QuestionDifficulty.Medium,
            "zor" or "zor seviye" => QuestionDifficulty.Hard,
            _ when Enum.TryParse<QuestionDifficulty>(value.Trim(), true, out var difficulty)
                && Enum.IsDefined(difficulty) => difficulty,
            _ => QuestionDifficulty.Medium
        };
    }

    public static bool IsSupported(string? value) =>
        string.IsNullOrWhiteSpace(value)
        || value.Trim().ToLowerInvariant() is
            "kolay" or "kolay seviye"
            or "orta" or "orta seviye"
            or "zor" or "zor seviye"
        || (Enum.TryParse<QuestionDifficulty>(value.Trim(), true, out var difficulty)
            && Enum.IsDefined(difficulty));
}
