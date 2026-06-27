namespace API.Entities;

public class WrongAnswerReviewHistory : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;

    public AppUser? Student { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public Guid? QuizAttemptId { get; set; }

    public QuizAttempt? QuizAttempt { get; set; }

    public bool AnsweredCorrect { get; set; }

    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;

    public int? ResponseTimeSeconds { get; set; }
}
