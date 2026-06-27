namespace API.Entities;

public class SupportTicketNotification : BaseEntity
{
    public Guid TicketId { get; set; }

    public SupportTicket? Ticket { get; set; }

    public string? RecipientUserId { get; set; }

    public AppUser? RecipientUser { get; set; }

    public SupportTicketNotificationType Type { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }
}
