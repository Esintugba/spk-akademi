namespace API.Configuration;

public class AiQuestionGenerationOptions
{
    public const string SectionName = "AiQuestionGeneration";

    public bool Enabled { get; set; }

    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";

    public string Model { get; set; } = "gpt-5.6";

    public int TimeoutSeconds { get; set; } = 120;

    public int MaxQuestionsPerJob { get; set; } = 50;

    public int MaxSourceCharacters { get; set; } = 60_000;
}
