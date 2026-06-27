namespace API.Entities;

public class ConsentLog : BaseEntity
{
    public string? UserId { get; set; }

    public AppUser? User { get; set; }

    public string ConsentType { get; set; } = string.Empty;

    public string Version { get; set; } = "v1";

    public bool Necessary { get; set; } = true;

    public bool Analytics { get; set; }

    public bool Marketing { get; set; }

    public bool KvkkAccepted { get; set; }

    public bool CommercialElectronicMessages { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }
}
