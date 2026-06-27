namespace API.Entities;

public class AdaptiveStudyTask : BaseEntity
{
    public Guid PlanId { get; set; }

    public AdaptiveStudyPlan? Plan { get; set; }

    public AdaptiveStudyTaskType Type { get; set; }

    public Guid? TopicId { get; set; }

    public Topic? Topic { get; set; }

    public int TargetMinutes { get; set; }

    public int TargetQuestions { get; set; }

    public decimal Priority { get; set; }

    public string ActionUrl { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool Completed { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int ActualMinutes { get; set; }

    public int ActualQuestions { get; set; }
}
