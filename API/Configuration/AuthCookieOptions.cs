namespace API.Configuration;

public sealed class AuthCookieOptions
{
    public const string SectionName = "AuthCookies";

    public const string CsrfHeaderName = "X-XSRF-TOKEN";

    public string RefreshTokenCookieName { get; set; } = "__Host-spk-refresh";

    public string AntiforgeryCookieName { get; set; } = "__Host-spk-antiforgery";

    public SameSiteMode SameSite { get; set; } = SameSiteMode.Lax;

    public bool Secure { get; set; } = true;

    public string Path { get; set; } = "/";
}
