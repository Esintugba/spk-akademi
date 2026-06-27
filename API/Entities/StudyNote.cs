namespace API.Entities;

public class StudyNote : ModeratedEntity
{
    public Guid TopicId { get; set; }

    public Topic? Topic { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public string? SourceReference { get; set; }

    public bool IsAiGenerated { get; set; }
}
