using API.Dtos;
using API.Entities;
using API.Configuration;
using API.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace API.Services;

public enum AccountServiceError
{
    None,
    Unauthorized,
    ValidationFailed,
    IdentityFailed,
    RefreshTokenInvalid
}

public sealed class AccountServiceOutcome<T>
{
    public AccountServiceError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static AccountServiceOutcome<T> Success(T result) =>
        new() { Error = AccountServiceError.None, Result = result };

    public static AccountServiceOutcome<T> Fail(AccountServiceError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IAccountService
{
    Task<AccountServiceOutcome<bool>> RegisterAsync(
        RegisterDto dto,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default);

    Task<AccountServiceOutcome<AuthResponseDto>> LoginAsync(LoginDto dto);

    Task<AccountServiceOutcome<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto);

    Task<AccountServiceOutcome<AccountProfileDto>> GetProfileAsync(AppUser? user);

    Task<AccountServiceOutcome<bool>> UpdateProfileAsync(AppUser? user, UpdateAccountProfileDto dto);

    Task<AccountServiceOutcome<bool>> ChangePasswordAsync(AppUser? user, ChangePasswordDto dto);

    Task<AccountServiceOutcome<bool>> ForgotPasswordAsync(
        ForgotPasswordDto dto,
        CancellationToken cancellationToken = default);

    Task<AccountServiceOutcome<bool>> ResetPasswordAsync(ResetPasswordDto dto);

    Task<AccountServiceOutcome<bool>> LogoutAllAsync(AppUser? user);
}

public class AccountService(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    IOnboardingService onboardingService,
    IConsentLogRepository consentLogs,
    IEmailNotificationService emailService,
    IOptions<SeoOptions> seoOptions) : IAccountService
{
    private readonly SeoOptions _seoOptions = seoOptions.Value;

    public async Task<AccountServiceOutcome<bool>> RegisterAsync(
        RegisterDto dto,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        if (!dto.KvkkAccepted)
        {
            return AccountServiceOutcome<bool>.Fail(
                AccountServiceError.ValidationFailed,
                "KVKK aydınlatma metni onayı zorunludur.");
        }

        var user = new AppUser
        {
            DisplayName = dto.Email,
            Email = dto.Email,
            UserName = dto.Email
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return AccountServiceOutcome<bool>.Fail(
                AccountServiceError.IdentityFailed,
                JoinIdentityErrors(result));
        }

        var roleResult = await userManager.AddToRoleAsync(user, AppRoles.Student);
        if (!roleResult.Succeeded)
        {
            return AccountServiceOutcome<bool>.Fail(
                AccountServiceError.IdentityFailed,
                JoinIdentityErrors(roleResult));
        }

        await onboardingService.InitializeNewStudentAsync(user.Id, cancellationToken);

        await consentLogs.AddAsync(new ConsentLog
        {
            UserId = user.Id,
            ConsentType = "register",
            Version = dto.ConsentVersion,
            Necessary = true,
            KvkkAccepted = dto.KvkkAccepted,
            CommercialElectronicMessages = dto.CommercialElectronicMessages,
            IpAddress = ipAddress,
            UserAgent = userAgent
        }, cancellationToken);
        await consentLogs.SaveChangesAsync(cancellationToken);

        return AccountServiceOutcome<bool>.Success(true);
    }

    public async Task<AccountServiceOutcome<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);

        if (user is null || !await userManager.CheckPasswordAsync(user, dto.Password))
        {
            return AccountServiceOutcome<AuthResponseDto>.Fail(
                AccountServiceError.Unauthorized,
                "E-posta veya şifre hatalı.");
        }

        var roles = await userManager.GetRolesAsync(user);
        if (roles.Count == 0)
        {
            await userManager.AddToRoleAsync(user, AppRoles.Student);
        }

        return AccountServiceOutcome<AuthResponseDto>.Success(await tokenService.CreateTokenResponse(user));
    }

    public async Task<AccountServiceOutcome<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto)
    {
        var user = await userManager.Users
            .FirstOrDefaultAsync(x => x.RefreshToken == dto.RefreshToken);

        if (user is null ||
            string.IsNullOrWhiteSpace(user.RefreshToken) ||
            user.RefreshTokenExpiresAt <= DateTime.UtcNow)
        {
            return AccountServiceOutcome<AuthResponseDto>.Fail(
                AccountServiceError.RefreshTokenInvalid,
                "Oturum yenileme anahtarı geçersiz.");
        }

        return AccountServiceOutcome<AuthResponseDto>.Success(await tokenService.CreateTokenResponse(user));
    }

    public async Task<AccountServiceOutcome<AccountProfileDto>> GetProfileAsync(AppUser? user)
    {
        if (user is null)
        {
            return AccountServiceOutcome<AccountProfileDto>.Fail(AccountServiceError.Unauthorized);
        }

        var role = (await userManager.GetRolesAsync(user)).FirstOrDefault() ?? AppRoles.Student;
        return AccountServiceOutcome<AccountProfileDto>.Success(
            new AccountProfileDto(user.Email ?? string.Empty, user.DisplayName, role));
    }

    public async Task<AccountServiceOutcome<bool>> UpdateProfileAsync(
        AppUser? user,
        UpdateAccountProfileDto dto)
    {
        if (user is null)
        {
            return AccountServiceOutcome<bool>.Fail(AccountServiceError.Unauthorized);
        }

        user.DisplayName = dto.DisplayName.Trim();
        var result = await userManager.UpdateAsync(user);

        return result.Succeeded
            ? AccountServiceOutcome<bool>.Success(true)
            : AccountServiceOutcome<bool>.Fail(AccountServiceError.IdentityFailed, JoinIdentityErrors(result));
    }

    public async Task<AccountServiceOutcome<bool>> ChangePasswordAsync(
        AppUser? user,
        ChangePasswordDto dto)
    {
        if (user is null)
        {
            return AccountServiceOutcome<bool>.Fail(AccountServiceError.Unauthorized);
        }

        var result = await userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            return AccountServiceOutcome<bool>.Fail(AccountServiceError.IdentityFailed, JoinIdentityErrors(result));
        }

        await RevokeRefreshTokensAsync(user);
        return AccountServiceOutcome<bool>.Success(true);
    }

    public async Task<AccountServiceOutcome<bool>> ForgotPasswordAsync(
        ForgotPasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            return AccountServiceOutcome<bool>.Success(true);
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetLink = BuildPasswordResetLink(user.Email, token);
        var email = EmailTemplates.PasswordReset(resetLink);

        await emailService.SendAsync(user.Email, email.Subject, email.Body, cancellationToken);

        return AccountServiceOutcome<bool>.Success(true);
    }

    public async Task<AccountServiceOutcome<bool>> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null)
        {
            return AccountServiceOutcome<bool>.Fail(
                AccountServiceError.IdentityFailed,
                "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.");
        }

        var result = await userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded)
        {
            return AccountServiceOutcome<bool>.Fail(AccountServiceError.IdentityFailed, JoinIdentityErrors(result));
        }

        await RevokeRefreshTokensAsync(user);
        return AccountServiceOutcome<bool>.Success(true);
    }

    public async Task<AccountServiceOutcome<bool>> LogoutAllAsync(AppUser? user)
    {
        if (user is null)
        {
            return AccountServiceOutcome<bool>.Fail(AccountServiceError.Unauthorized);
        }

        await RevokeRefreshTokensAsync(user);
        return AccountServiceOutcome<bool>.Success(true);
    }

    private async Task RevokeRefreshTokensAsync(AppUser user)
    {
        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await userManager.UpdateSecurityStampAsync(user);
        await userManager.UpdateAsync(user);
    }

    private string BuildPasswordResetLink(string email, string token)
    {
        var baseUrl = string.IsNullOrWhiteSpace(_seoOptions.PublicBaseUrl)
            ? "http://localhost:8080"
            : _seoOptions.PublicBaseUrl.TrimEnd('/');

        return $"{baseUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
    }

    private static string JoinIdentityErrors(IdentityResult result) =>
        string.Join(" ", result.Errors.Select(x => x.Description));
}
