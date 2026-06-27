namespace API.Entities;

public class SupportTicketStatusHistory : BaseEntity
{
    public Guid TicketId { get; set; }

    public SupportTicket? Ticket { get; set; }

    public string? ChangedById { get; set; }

    public AppUser? ChangedBy { get; set; }

    public SupportTicketStatus? OldStatus { get; set; }

    public SupportTicketStatus NewStatus { get; set; }

    public string? Note { get; set; }
}
