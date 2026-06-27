namespace API.Entities;

public class QuestionOption : BaseEntity
{
    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public string Label { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }
}
