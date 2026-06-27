namespace API.Entities;

public class AccessRequest : BaseEntity
{
    public string StudentId { get; set; } = string.Empty;

    public AppUser? Student { get; set; }

    public Guid PlanId { get; set; }

    public Plan? Plan { get; set; }

    public AccessRequestStatus Status { get; set; } = AccessRequestStatus.Pending;

    public string? Message { get; set; }

    public string? AdminNote { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }

    public string? ReviewedByUserId { get; set; }

    public AppUser? ReviewedBy { get; set; }

    public bool EmailSent { get; set; }
}
