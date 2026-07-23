namespace API.Entities;

public class AccessRequestHistory : BaseEntity
{
    public Guid AccessRequestId { get; set; }

    public AccessRequest? AccessRequest { get; set; }

    public AccessRequestStatus FromStatus { get; set; }

    public AccessRequestStatus ToStatus { get; set; }

    public string? AdminNote { get; set; }

    public string? CorrectionReason { get; set; }

    public bool IsCorrection { get; set; }

    public string? ChangedByUserId { get; set; }

    public AppUser? ChangedBy { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
