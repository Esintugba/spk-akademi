namespace API.Entities;

public class AdaptiveStudyPlan : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public DateOnly PlanDate { get; set; }

    public int EstimatedMinutes { get; set; }

    public decimal CompletionRate { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public int DaysUntilExam { get; set; }

    public decimal EstimatedTargetCompletionRate { get; set; }

    public string? Summary { get; set; }

    public ICollection<AdaptiveStudyTask> Tasks { get; set; } = new List<AdaptiveStudyTask>();
}
