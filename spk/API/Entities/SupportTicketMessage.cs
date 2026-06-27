namespace API.Entities;

public class SupportTicketMessage : BaseEntity
{
    public Guid TicketId { get; set; }

    public SupportTicket? Ticket { get; set; }

    public string SenderId { get; set; } = string.Empty;

    public AppUser? Sender { get; set; }

    public string Message { get; set; } = string.Empty;

    public string? AttachmentUrl { get; set; }

    public bool IsAdminReply { get; set; }
}
