namespace API.Entities;

public class XPTransaction : BaseEntity
{
    public string UserId { get; set; } = string.Empty;

    public AppUser? User { get; set; }

    public int Amount { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string ReferenceType { get; set; } = string.Empty;

    public string? ReferenceId { get; set; }
}
