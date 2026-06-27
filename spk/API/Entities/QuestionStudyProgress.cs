namespace API.Entities;

public class QuestionStudyProgress : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;

    public AppUser? Student { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public int Repetition { get; set; }

    public decimal EaseFactor { get; set; } = 2.5m;

    public int IntervalDays { get; set; } = 1;

    public DateTime? NextReviewAt { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    public int ConsecutiveCorrectCount { get; set; }

    public MasteryLevel MasteryLevel { get; set; } = MasteryLevel.Beginner;

    public decimal CorrectRate { get; set; }

    public int AverageResponseTimeSeconds { get; set; }

    public int TotalReviews { get; set; }

    public int CorrectReviews { get; set; }
}
