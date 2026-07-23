namespace API.Entities;

public class AiQuestionDraft : BaseEntity
{
    public Guid JobId { get; set; }

    public AiQuestionGenerationJob? Job { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string? OptionE { get; set; }

    public string CorrectOption { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;

    public QuestionDifficulty Difficulty { get; set; } = QuestionDifficulty.Medium;

    public int SourcePage { get; set; }

    public string SourceExcerpt { get; set; } = string.Empty;

    public AiQuestionDraftStatus Status { get; set; } = AiQuestionDraftStatus.PendingReview;

    public Guid? PublishedQuestionId { get; set; }

    public Question? PublishedQuestion { get; set; }

    public string? ReviewedByUserId { get; set; }

    public AppUser? ReviewedByUser { get; set; }

    public DateTime? ReviewedAt { get; set; }
}
