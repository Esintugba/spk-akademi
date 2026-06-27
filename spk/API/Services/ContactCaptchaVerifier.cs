using System.Text.Json;
using API.Configuration;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IContactCaptchaVerifier
{
    Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken = default);
}

public class ContactCaptchaVerifier(
    HttpClient httpClient,
    IOptions<ContactOptions> options,
    ILogger<ContactCaptchaVerifier> logger) : IContactCaptchaVerifier
{
    public async Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.RequireCaptcha)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(settings.CaptchaSecret))
        {
            return false;
        }

        var verifyUrl = !string.IsNullOrWhiteSpace(settings.CaptchaVerifyUrl)
            ? settings.CaptchaVerifyUrl
            : settings.CaptchaProvider.Equals("hcaptcha", StringComparison.OrdinalIgnoreCase)
                ? "https://hcaptcha.com/siteverify"
                : "https://www.google.com/recaptcha/api/siteverify";

        try
        {
            using var content = new FormUrlEncodedContent(new Dictionary<string, string?>
            {
                ["secret"] = settings.CaptchaSecret,
                ["response"] = token,
                ["remoteip"] = remoteIp
            }.Where(x => !string.IsNullOrWhiteSpace(x.Value)).ToDictionary(x => x.Key, x => x.Value!));

            using var response = await httpClient.PostAsync(verifyUrl, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            return document.RootElement.TryGetProperty("success", out var success) && success.GetBoolean();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Captcha verification failed.");
            return false;
        }
    }
}
