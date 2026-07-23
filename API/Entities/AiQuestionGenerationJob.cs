namespace API.Entities;

public class AiQuestionGenerationJob : BaseEntity
{
    public Guid SourceDocumentId { get; set; }

    public SourceDocument? SourceDocument { get; set; }

    public Guid TopicId { get; set; }

    public Topic? Topic { get; set; }

    public string? RequestedByUserId { get; set; }

    public AppUser? RequestedByUser { get; set; }

    public int StartPage { get; set; }

    public int EndPage { get; set; }

    public int EasyQuestionCount { get; set; }

    public int MediumQuestionCount { get; set; }

    public int HardQuestionCount { get; set; }

    public bool IncludeExplanations { get; set; } = true;

    public string Model { get; set; } = string.Empty;

    public AiQuestionGenerationJobStatus Status { get; set; } = AiQuestionGenerationJobStatus.Pending;

    public int GeneratedQuestionCount { get; set; }

    public int InputTokens { get; set; }

    public int OutputTokens { get; set; }

    public string? ErrorMessage { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ICollection<AiQuestionDraft> Drafts { get; set; } = new List<AiQuestionDraft>();
}
