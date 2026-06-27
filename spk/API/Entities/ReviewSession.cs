namespace API.Entities;

public class ReviewSession : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;

    public AppUser? Student { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public int QuestionCount { get; set; }

    public int CorrectCount { get; set; }

    public decimal AverageQuality { get; set; }

    public ICollection<ReviewSessionAnswer> Answers { get; set; } = new List<ReviewSessionAnswer>();
}
