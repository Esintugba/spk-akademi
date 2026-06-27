namespace API.Entities;

public class TrialExamPurchase : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public Guid TrialExamId { get; set; }

    public TrialExam? TrialExam { get; set; }

    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
}
