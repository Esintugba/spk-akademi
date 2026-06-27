namespace API.Entities;

public enum TopicType
{
    MainTopic = 1,
    SubTopic = 2
}

public class Topic : BaseEntity
{
    public Guid CourseId { get; set; }

    public Course? Course { get; set; }

    public Guid? ParentTopicId { get; set; }

    public Topic? ParentTopic { get; set; }

    public TopicType Type { get; set; } = TopicType.MainTopic;

    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public int Order { get; set; }

    public string? Summary { get; set; }

    public string? ImportantPoints { get; set; }

    public string? CommonMistakes { get; set; }

    public string? Formulas { get; set; }

    public string? ExamNotes { get; set; }

    public string? CriticalThresholds { get; set; }

    public ICollection<StudyNote> StudyNotes { get; set; } = new List<StudyNote>();

    public ICollection<Question> Questions { get; set; } = new List<Question>();

    public ICollection<Topic> SubTopics { get; set; } = new List<Topic>();
}
