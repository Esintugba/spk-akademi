using System.Net;
using System.Text.RegularExpressions;
using API.Configuration;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.Extensions.Options;

namespace API.Services;

public enum ContactMessageError
{
    None,
    Spam,
    RateLimited,
    Duplicate,
    CaptchaInvalid,
    NotFound
}

public interface IContactService
{
    Task<(ContactMessageError Error, ContactMessageResponseDto? Result)> CreateAsync(
        CreateContactMessageDto dto,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default);

    Task<AdminContactMessageListDto> GetAdminMessagesAsync(
        ContactMessageQueryDto query,
        CancellationToken cancellationToken = default);

    Task<(ContactMessageError Error, AdminContactMessageDto? Result)> GetAdminMessageAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<(ContactMessageError Error, AdminContactMessageDto? Result)> UpdateStatusAsync(
        Guid id,
        UpdateContactMessageStatusDto dto,
        CancellationToken cancellationToken = default);
}

public class ContactService(
    IContactMessageRepository repository,
    IContactNotificationService notificationService,
    IContactCaptchaVerifier captchaVerifier,
    IOptions<ContactOptions> options,
    ILogger<ContactService> logger,
    API.Data.DataContext context) : IContactService
{
    private static readonly Regex TagRegex = new("<.*?>", RegexOptions.Compiled);
    private static readonly Regex ControlRegex = new("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", RegexOptions.Compiled);
    private static readonly Regex HeaderBreakRegex = new("[\\r\\n]+", RegexOptions.Compiled);

    public async Task<(ContactMessageError Error, ContactMessageResponseDto? Result)> CreateAsync(
        CreateContactMessageDto dto,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(dto.Website))
        {
            logger.LogWarning("Contact honeypot triggered from {IpAddress}.", ipAddress);
            return (ContactMessageError.Spam, null);
        }

        if (!await captchaVerifier.VerifyAsync(dto.CaptchaToken, ipAddress, cancellationToken))
        {
            return (ContactMessageError.CaptchaInvalid, null);
        }

        var settings = options.Value;
        var now = DateTime.UtcNow;
        var throttleWindow = TimeSpan.FromMinutes(Math.Max(1, settings.IpThrottleWindowMinutes));
        var recentCount = await repository.CountRecentByIpAsync(ipAddress, now.Subtract(throttleWindow), cancellationToken);
        if (recentCount >= Math.Max(1, settings.MaxRecentMessagesPerIp))
        {
            return (ContactMessageError.RateLimited, null);
        }

        var message = new ContactMessage
        {
            Name = SanitizeSingleLine(dto.Name, 120),
            Email = SanitizeEmail(dto.Email),
            Subject = SanitizeSingleLine(dto.Subject, 180),
            Message = SanitizeMultiline(dto.Message, 4000),
            IpAddress = SanitizeSingleLine(ipAddress ?? string.Empty, 64),
            UserAgent = SanitizeSingleLine(userAgent ?? string.Empty, 512),
            Status = ContactMessageStatus.Pending,
            CreatedAt = now
        };

        if (await repository.HasRecentDuplicateAsync(
                message.Email,
                message.Subject,
                message.Message,
                now.Subtract(TimeSpan.FromHours(Math.Max(1, settings.DuplicateWindowHours))),
                cancellationToken))
        {
            return (ContactMessageError.Duplicate, null);
        }

        await repository.AddAsync(message, cancellationToken);
        context.ConsentLogs.Add(new ConsentLog
        {
            ConsentType = "contact",
            Version = "v1",
            Necessary = true,
            KvkkAccepted = dto.KvkkAccepted,
            CommercialElectronicMessages = dto.CommercialElectronicMessages,
            IpAddress = SanitizeSingleLine(ipAddress ?? string.Empty, 64),
            UserAgent = SanitizeSingleLine(userAgent ?? string.Empty, 512)
        });
        await repository.SaveAsync(cancellationToken);
        await notificationService.NotifyNewMessageAsync(message, cancellationToken);

        return (ContactMessageError.None, new ContactMessageResponseDto(message.Id, "Mesajınız başarıyla gönderildi."));
    }

    public async Task<AdminContactMessageListDto> GetAdminMessagesAsync(
        ContactMessageQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount, unreadCount) = await repository.QueryAdminAsync(query, cancellationToken);
        return new AdminContactMessageListDto(
            items.Select(ToAdminDto).ToList(),
            totalCount,
            Math.Max(1, query.Page),
            Math.Clamp(query.PageSize, 1, 100),
            unreadCount);
    }

    public async Task<(ContactMessageError Error, AdminContactMessageDto? Result)> GetAdminMessageAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var message = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (message is null)
        {
            return (ContactMessageError.NotFound, null);
        }

        if (message.ReadAt is null && message.Status == ContactMessageStatus.Pending)
        {
            message.ReadAt = DateTime.UtcNow;
            message.Status = ContactMessageStatus.Read;
            message.UpdatedAt = DateTime.UtcNow;
            await repository.SaveAsync(cancellationToken);
        }

        return (ContactMessageError.None, ToAdminDto(message));
    }

    public async Task<(ContactMessageError Error, AdminContactMessageDto? Result)> UpdateStatusAsync(
        Guid id,
        UpdateContactMessageStatusDto dto,
        CancellationToken cancellationToken = default)
    {
        var message = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (message is null)
        {
            return (ContactMessageError.NotFound, null);
        }

        var now = DateTime.UtcNow;
        message.Status = dto.Status;
        message.AdminNote = string.IsNullOrWhiteSpace(dto.AdminNote)
            ? null
            : SanitizeMultiline(dto.AdminNote, 2000);
        message.AssignedToUserId = string.IsNullOrWhiteSpace(dto.AssignedToUserId)
            ? null
            : dto.AssignedToUserId.Trim();
        message.ReadAt ??= now;
        if (dto.Status is ContactMessageStatus.Resolved or ContactMessageStatus.Closed)
        {
            message.RepliedAt ??= now;
        }

        message.UpdatedAt = now;
        await repository.SaveAsync(cancellationToken);

        return (ContactMessageError.None, ToAdminDto(message));
    }

    private static AdminContactMessageDto ToAdminDto(ContactMessage message) =>
        new(
            message.Id,
            message.Name,
            message.Email,
            message.Subject,
            message.Message,
            message.Status,
            message.IpAddress,
            message.UserAgent,
            message.CreatedAt,
            message.ReadAt,
            message.RepliedAt,
            message.AssignedToUserId,
            message.AssignedToUser?.Email,
            message.AdminNote);

    private static string SanitizeEmail(string value) =>
        HeaderBreakRegex.Replace(value.Trim().ToLowerInvariant(), string.Empty);

    private static string SanitizeSingleLine(string value, int maxLength)
    {
        var stripped = TagRegex.Replace(value, string.Empty).Trim();
        stripped = HeaderBreakRegex.Replace(stripped, " ");
        stripped = ControlRegex.Replace(stripped, string.Empty);
        return WebUtility.HtmlDecode(stripped)[..Math.Min(WebUtility.HtmlDecode(stripped).Length, maxLength)];
    }

    private static string SanitizeMultiline(string value, int maxLength)
    {
        var stripped = TagRegex.Replace(value, string.Empty).Trim();
        stripped = ControlRegex.Replace(stripped, string.Empty);
        var decoded = WebUtility.HtmlDecode(stripped);
        return decoded[..Math.Min(decoded.Length, maxLength)];
    }
}
