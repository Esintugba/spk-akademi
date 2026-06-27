namespace API.Entities;

public class UserTopicPreference : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid TopicId { get; set; }

    public Topic? Topic { get; set; }

    public bool IsFavorite { get; set; }

    public bool IsInWeeklyPlan { get; set; }
}
