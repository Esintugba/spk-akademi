namespace API.Entities;

public class StudyProgress : BaseEntity
{
    public string? UserId { get; set; }

    public AppUser? User { get; set; }

    public Guid TopicId { get; set; }

    public Topic? Topic { get; set; }

    public StudyStatus Status { get; set; } = StudyStatus.NotStarted;

    public int CorrectCount { get; set; }

    public int WrongCount { get; set; }

    public DateTime? LastStudiedAt { get; set; }

    public DateTime? NextReviewAt { get; set; }
}
