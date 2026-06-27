namespace API.Entities;

public class ReviewSessionAnswer : BaseEntity
{
    public Guid ReviewSessionId { get; set; }

    public ReviewSession? ReviewSession { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public int Quality { get; set; }

    public bool AnsweredCorrect { get; set; }

    public int? ResponseTimeSeconds { get; set; }

    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
}
