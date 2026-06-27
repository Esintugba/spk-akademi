namespace API.Entities;

public class ContactMessage : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public ContactMessageStatus Status { get; set; } = ContactMessageStatus.Pending;

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime? ReadAt { get; set; }

    public DateTime? RepliedAt { get; set; }

    public string? AssignedToUserId { get; set; }

    public AppUser? AssignedToUser { get; set; }

    public string? AdminNote { get; set; }
}
