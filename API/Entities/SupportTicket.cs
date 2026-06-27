namespace API.Entities;

public class SupportTicket : BaseEntity
{
    public string TicketNumber { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public SupportTicketCategory Category { get; set; } = SupportTicketCategory.Other;

    public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Normal;

    public string Subject { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

    public string? AssignedAdminId { get; set; }

    public AppUser? AssignedAdmin { get; set; }

    public DateTime? ClosedAt { get; set; }

    public ICollection<SupportTicketMessage> Messages { get; set; } = [];

    public ICollection<SupportTicketStatusHistory> StatusHistory { get; set; } = [];
}
