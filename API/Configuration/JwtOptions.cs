namespace API.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;

    public string Issuer { get; set; } = "spk-api";

    public string Audience { get; set; } = "spk-client";

    public string[] PreviousKeys { get; set; } = [];

    public int AccessTokenMinutes { get; set; } = 60;

    public int RefreshTokenDays { get; set; } = 7;

    public IEnumerable<string> GetValidationKeys()
    {
        if (!string.IsNullOrWhiteSpace(Key))
        {
            yield return Key.Trim();
        }

        foreach (var previousKey in PreviousKeys)
        {
            if (!string.IsNullOrWhiteSpace(previousKey))
            {
                yield return previousKey.Trim();
            }
        }
    }
}
