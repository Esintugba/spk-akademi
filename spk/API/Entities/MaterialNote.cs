namespace API.Entities;

public class MaterialNote : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid MaterialId { get; set; }

    public SourceDocument? Material { get; set; }

    public int PageNumber { get; set; }

    public string? SelectedText { get; set; }

    public string Note { get; set; } = string.Empty;

    public MaterialHighlightColor HighlightColor { get; set; } = MaterialHighlightColor.Yellow;

    public bool IsFavorite { get; set; }

    public string? FolderName { get; set; }

    public string Tags { get; set; } = string.Empty;

    public bool IsInReview { get; set; }

    public int ReviewRepetition { get; set; }

    public decimal ReviewEaseFactor { get; set; } = 2.5m;

    public int ReviewIntervalDays { get; set; } = 1;

    public DateTime? NextReviewAt { get; set; }

    public DateTime? LastReviewedAt { get; set; }

    public int TotalReviews { get; set; }

    public int SuccessfulReviews { get; set; }
}

