namespace API.Entities;

public class Question : ModeratedEntity
{
    public Guid TopicId { get; set; }

    public Topic? Topic { get; set; }

    public string Text { get; set; } = string.Empty;

    public QuestionDifficulty Difficulty { get; set; } = QuestionDifficulty.Medium;

    public QuestionType Type { get; set; } = QuestionType.Concept;

    public string Explanation { get; set; } = string.Empty;

    public string? SolutionNote { get; set; }

    public bool IsPastExamQuestion { get; set; }

    public int? ExamYear { get; set; }

    public ExamType? ExamType { get; set; }

    public ExamSession? ExamSession { get; set; }

    public string? SourceReference { get; set; }

    public string? SourceText { get; set; }

    public bool IsAiGenerated { get; set; }

    public ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();

    public ICollection<QuizAnswer> QuizAnswers { get; set; } = new List<QuizAnswer>();
}
