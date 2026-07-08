namespace API.Configuration;

public sealed class ForwardedHeadersConfigurationOptions
{
    public const string SectionName = "ForwardedHeaders";

    public bool Enabled { get; set; }

    public string[] KnownProxies { get; set; } = [];

    public string[] KnownNetworks { get; set; } = [];

    public int ForwardLimit { get; set; } = 1;

    public bool RequireHeaderSymmetry { get; set; } = true;
}
