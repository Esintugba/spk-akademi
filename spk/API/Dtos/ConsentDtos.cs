namespace API.Dtos;

public record CookieConsentDto(
    bool Necessary,
    bool Analytics,
    bool Marketing,
    string Version = "v1");

public record KvkkConsentDto(
    string ConsentType,
    bool KvkkAccepted,
    bool CommercialElectronicMessages,
    string Version = "v1");

public record ConsentSummaryDto(
    int CookieAcceptedCount,
    int CookieRejectedCount,
    DateTime? LastCookieConsentAt,
    int KvkkConsentCount,
    DateTime? LastKvkkConsentAt,
    IReadOnlyList<ConsentLogDto> RecentConsents);

public record ConsentLogDto(
    Guid Id,
    string? UserId,
    string ConsentType,
    string? IpAddress,
    DateTime CreatedAt,
    string Version,
    bool Analytics,
    bool Marketing,
    bool KvkkAccepted,
    bool CommercialElectronicMessages);
