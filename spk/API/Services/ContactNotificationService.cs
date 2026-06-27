using API.Configuration;
using API.Entities;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IContactNotificationService
{
    Task NotifyNewMessageAsync(ContactMessage message, CancellationToken cancellationToken = default);
}

public class ContactNotificationService(
    IContactNotificationQueue queue,
    IOptions<EmailOptions> emailOptions) : IContactNotificationService
{
    public async Task NotifyNewMessageAsync(ContactMessage message, CancellationToken cancellationToken = default)
    {
        var settings = emailOptions.Value;
        var adminEmail = string.IsNullOrWhiteSpace(settings.AdminNotificationAddress)
            ? "destek@spkakademi.com"
            : settings.AdminNotificationAddress;

        await queue.EnqueueAsync(
            new ContactEmailNotification(
                adminEmail,
                "[SPK Akademi] Yeni iletişim formu mesajı",
                $"""
                Yeni iletişim formu mesajı alındı.

                Ad Soyad: {message.Name}
                E-posta: {message.Email}
                Konu: {message.Subject}
                Tarih: {message.CreatedAt:u}
                IP: {message.IpAddress ?? "-"}

                Mesaj:
                {message.Message}
                """),
            cancellationToken);

        await queue.EnqueueAsync(
            new ContactEmailNotification(
                message.Email,
                "[SPK Akademi] Mesajınız alındı",
                $"""
                Merhaba {message.Name},

                Mesajınız başarıyla alındı.
                Ekibimiz sizinle en kısa sürede iletisime geçecektir.

                Talep numarası: {message.Id}

                -
                SPK Akademi
                """),
            cancellationToken);
    }
}
