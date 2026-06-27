namespace API.Entities;

public class UserMaterialProgress : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid MaterialId { get; set; }

    public SourceDocument? Material { get; set; }

    public int LastPage { get; set; }

    public decimal ProgressPercentage { get; set; }

    public DateTime LastOpenedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public int TotalSecondsRead { get; set; }
}

