namespace API.Entities;

public class TrialExam : ModeratedEntity
{
    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid? LicenseId { get; set; }

    public License? License { get; set; }

    public int DurationMinutes { get; set; } = 60;

    public int QuestionCount { get; set; } = 10;

    public bool IsFree { get; set; } = true;

    public bool IsPublished { get; set; }

    public bool IsFeatured { get; set; }

    public QuestionDifficulty DifficultyLevel { get; set; } = QuestionDifficulty.Medium;

    public string? Tags { get; set; }

    public decimal PopularityScore { get; set; }

    public ICollection<TrialExamQuestion> Questions { get; set; } = new List<TrialExamQuestion>();
}
