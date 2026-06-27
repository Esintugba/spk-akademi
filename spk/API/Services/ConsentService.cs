using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum ConsentError
{
    None,
    KvkkRequired
}

public sealed class ConsentOutcome
{
    public ConsentError Error { get; init; }

    public string? Message { get; init; }

    public static ConsentOutcome Success() => new() { Error = ConsentError.None };

    public static ConsentOutcome Fail(ConsentError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IConsentService
{
    Task SaveCookieConsentAsync(
        CookieConsentDto dto,
        string? userId,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default);

    Task<ConsentOutcome> SaveKvkkConsentAsync(
        KvkkConsentDto dto,
        string? userId,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default);
}

public interface IConsentAdminService
{
    Task<ConsentSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);
}

public class ConsentService(IConsentLogRepository consentLogs) : IConsentService
{
    public async Task SaveCookieConsentAsync(
        CookieConsentDto dto,
        string? userId,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        await consentLogs.AddAsync(new ConsentLog
        {
            UserId = userId,
            ConsentType = "cookie",
            Version = dto.Version,
            Necessary = true,
            Analytics = dto.Analytics,
            Marketing = dto.Marketing,
            IpAddress = ipAddress,
            UserAgent = userAgent
        }, cancellationToken);

        await consentLogs.SaveChangesAsync(cancellationToken);
    }

    public async Task<ConsentOutcome> SaveKvkkConsentAsync(
        KvkkConsentDto dto,
        string? userId,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        if (!dto.KvkkAccepted)
        {
            return ConsentOutcome.Fail(
                ConsentError.KvkkRequired,
                "KVKK aydinlatma metni onayi zorunludur.");
        }

        await consentLogs.AddAsync(new ConsentLog
        {
            UserId = userId,
            ConsentType = dto.ConsentType,
            Version = dto.Version,
            Necessary = true,
            KvkkAccepted = dto.KvkkAccepted,
            CommercialElectronicMessages = dto.CommercialElectronicMessages,
            IpAddress = ipAddress,
            UserAgent = userAgent
        }, cancellationToken);

        await consentLogs.SaveChangesAsync(cancellationToken);
        return ConsentOutcome.Success();
    }
}

public class ConsentAdminService(IConsentLogRepository consentLogs) : IConsentAdminService
{
    public Task<ConsentSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default) =>
        consentLogs.GetSummaryAsync(cancellationToken);
}
