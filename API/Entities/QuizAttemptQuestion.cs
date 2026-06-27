namespace API.Entities;

public class QuizAttemptQuestion : BaseEntity
{
    public Guid QuizAttemptId { get; set; }

    public QuizAttempt? QuizAttempt { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public int Order { get; set; }
}
