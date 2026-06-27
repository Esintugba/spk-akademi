namespace API.Entities;

public class WrongAnswerQueue : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;

    public AppUser? Student { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public int WrongCount { get; set; } = 1;

    public int ReviewCount { get; set; }

    public DateTime LastWrongAt { get; set; } = DateTime.UtcNow;

    public DateTime NextReviewAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastReviewedAt { get; set; }

    public bool IsMastered { get; set; }
}
