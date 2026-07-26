using API.Entities;
using API.Services;

namespace API.UnitTests.Services;

public class QuestionImportDifficultyParserTests
{
    [Theory]
    [InlineData("Kolay", QuestionDifficulty.Easy)]
    [InlineData("kolay seviye", QuestionDifficulty.Easy)]
    [InlineData("Orta", QuestionDifficulty.Medium)]
    [InlineData("ORTA SEVİYE", QuestionDifficulty.Medium)]
    [InlineData("Zor", QuestionDifficulty.Hard)]
    [InlineData("zor seviye", QuestionDifficulty.Hard)]
    [InlineData("Easy", QuestionDifficulty.Easy)]
    [InlineData("Medium", QuestionDifficulty.Medium)]
    [InlineData("Hard", QuestionDifficulty.Hard)]
    public void ParseOrDefault_MapsSupportedTurkishAndEnglishValues(
        string value,
        QuestionDifficulty expected)
    {
        var result = QuestionImportDifficultyParser.ParseOrDefault(value);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    public void ParseOrDefault_UsesMediumWhenValueIsEmpty(string? value)
    {
        var result = QuestionImportDifficultyParser.ParseOrDefault(value);

        Assert.Equal(QuestionDifficulty.Medium, result);
    }

    [Fact]
    public void IsSupported_RejectsUnknownValue()
    {
        Assert.False(QuestionImportDifficultyParser.IsSupported("Çok kolay"));
    }
}
