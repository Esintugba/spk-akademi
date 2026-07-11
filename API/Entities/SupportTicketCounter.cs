namespace API.Entities;

public class SupportTicketCounter : BaseEntity
{
    public string DateKey { get; set; } = string.Empty;

    public int LastNumber { get; set; }
}
