namespace API.Entities;

public class SourceDocument : ModeratedEntity
{
    public Guid CourseId { get; set; }

    public Course? Course { get; set; }

    public string Title { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public string SourceName { get; set; } = string.Empty;

    public DateOnly? SourcePublishedAt { get; set; }

    public DateOnly? SourceUpdatedAt { get; set; }

    public int PageCount { get; set; }

    public string? ExtractedText { get; set; }

    public DateTime? TextExtractedAt { get; set; }
}
