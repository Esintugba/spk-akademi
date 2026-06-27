namespace API.Entities;

public class QuizAnswer : BaseEntity
{
    public Guid QuizAttemptId { get; set; }

    public QuizAttempt? QuizAttempt { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public Guid? SelectedOptionId { get; set; }

    public QuestionOption? SelectedOption { get; set; }

    public bool IsCorrect { get; set; }

    public int? TimeSpentSeconds { get; set; }

    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
}
