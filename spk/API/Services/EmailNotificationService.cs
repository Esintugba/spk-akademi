using System.Net;
using System.Net.Mail;
using API.Configuration;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IEmailNotificationService
{
    Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default);
}

public class EmailNotificationService(
    IOptions<EmailOptions> options,
    ILogger<EmailNotificationService> logger) : IEmailNotificationService
{
    public async Task SendAsync(
        string toEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            return;
        }

        var settings = options.Value;

        if (!settings.Enabled || string.IsNullOrWhiteSpace(settings.SmtpHost))
        {
            logger.LogInformation(
                "Email (dev/log): To={To} Subject={Subject}\n{Body}",
                toEmail,
                subject,
                body);
            return;
        }

        if (!string.IsNullOrWhiteSpace(settings.SmtpUser) &&
            string.IsNullOrWhiteSpace(settings.SmtpPassword))
        {
            logger.LogWarning(
                "Email sending is enabled, but Email:SmtpPassword is not configured. To={To} Subject={Subject}",
                toEmail,
                subject);
            return;
        }

        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
        {
            EnableSsl = settings.UseSsl,
            Credentials = string.IsNullOrWhiteSpace(settings.SmtpUser)
                ? null
                : new NetworkCredential(settings.SmtpUser, settings.SmtpPassword)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(settings.FromAddress, settings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };

        message.To.Add(toEmail);

        await client.SendMailAsync(message, cancellationToken);
    }
}
