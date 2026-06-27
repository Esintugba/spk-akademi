using API.Entities;

namespace API.Dtos;

public record UserSummaryDto(
    string Id,
    string Email,
    string DisplayName,
    IReadOnlyList<string> Roles);

public record UserLicenseAccessDto(
    Guid Id,
    string UserId,
    string UserEmail,
    Guid LicenseId,
    string LicenseName,
    DateTime StartDate,
    DateTime? EndDate,
    bool IsActive,
    bool IsCurrentlyActive,
    AccessSource AccessSource,
    DateTime CreatedAt);

public record MyLicenseAccessDto(
    Guid LicenseId,
    string LicenseName,
    bool HasAccess,
    DateTime? StartDate,
    DateTime? EndDate,
    AccessSource? AccessSource,
    bool IsDemoAccess = false,
    bool GrantedAutomatically = false,
    DateTime? ExpiresAt = null);

public record CreateUserLicenseAccessDto(
    string UserId,
    Guid LicenseId,
    DateTime StartDate,
    DateTime? EndDate,
    bool IsActive,
    AccessSource AccessSource);

public record UpdateUserLicenseAccessDto(
    DateTime StartDate,
    DateTime? EndDate,
    bool IsActive,
    AccessSource AccessSource);
