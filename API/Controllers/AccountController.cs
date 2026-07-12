using API.Configuration;
using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace API.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController(
    UserManager<AppUser> userManager,
    IAccountService accountService,
    IAntiforgery antiforgery,
    IOptions<AuthCookieOptions> authCookieOptions,
    IHostEnvironment environment) : ControllerBase
{
    private readonly AuthCookieOptions _authCookieOptions = authCookieOptions.Value;

    [HttpGet("csrf")]
    [EnableRateLimiting("auth")]
    public IActionResult GetCsrfToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new CsrfTokenDto(tokens.RequestToken ?? string.Empty));
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(
        RegisterDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await accountService.RegisterAsync(
            dto,
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            cancellationToken);

        return ToEmptyActionResult(outcome, noContent: false);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ValidateAntiForgeryToken]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var outcome = await accountService.LoginAsync(dto);
        return ToAuthActionResult(outcome);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    [ValidateAntiForgeryToken]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshTokenDto dto)
    {
        var refreshToken = string.IsNullOrWhiteSpace(dto.RefreshToken)
            ? Request.Cookies[_authCookieOptions.RefreshTokenCookieName]
            : dto.RefreshToken;

        var outcome = await accountService.RefreshAsync(refreshToken);
        return ToAuthActionResult(outcome);
    }

    [HttpPost("logout")]
    [EnableRateLimiting("auth")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await accountService.LogoutAsync(Request.Cookies[_authCookieOptions.RefreshTokenCookieName]);
        DeleteRefreshTokenCookie();
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await accountService.ForgotPasswordAsync(dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var outcome = await accountService.ResetPasswordAsync(dto);
        return ToEmptyActionResult(outcome);
    }

    [Authorize(Roles = AppRoles.AdminAndStudent)]
    [HttpGet("me")]
    public async Task<ActionResult<AccountProfileDto>> GetMe()
    {
        var user = await userManager.GetUserAsync(User);
        var outcome = await accountService.GetProfileAsync(user);

        if (outcome.Error == AccountServiceError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [Authorize(Roles = AppRoles.AdminAndStudent)]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateAccountProfileDto dto)
    {
        var user = await userManager.GetUserAsync(User);
        var outcome = await accountService.UpdateProfileAsync(user, dto);
        return ToEmptyActionResult(outcome);
    }

    [Authorize(Roles = AppRoles.AdminAndStudent)]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var user = await userManager.GetUserAsync(User);
        var outcome = await accountService.ChangePasswordAsync(user, dto);
        if (outcome.Error == AccountServiceError.None)
        {
            DeleteRefreshTokenCookie();
        }

        return ToEmptyActionResult(outcome);
    }

    [Authorize(Roles = AppRoles.AdminAndStudent)]
    [HttpPost("logout-all")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> LogoutAll()
    {
        var user = await userManager.GetUserAsync(User);
        var outcome = await accountService.LogoutAllAsync(user);
        if (outcome.Error == AccountServiceError.None)
        {
            DeleteRefreshTokenCookie();
        }

        return ToEmptyActionResult(outcome);
    }

    private ActionResult<AuthResponseDto> ToAuthActionResult(AccountServiceOutcome<AuthResponseDto> outcome)
    {
        if (outcome.Error == AccountServiceError.None && outcome.Result is not null)
        {
            if (!string.IsNullOrWhiteSpace(outcome.Result.RefreshToken))
            {
                SetRefreshTokenCookie(outcome.Result.RefreshToken, outcome.Result.RefreshTokenExpiresAt);
            }

            return Ok(outcome.Result with { RefreshToken = null });
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(AccountServiceOutcome<bool> outcome, bool noContent = true)
    {
        if (outcome.Error == AccountServiceError.None)
        {
            return noContent ? NoContent() : Ok();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(AccountServiceError error, string? message) =>
        error switch
        {
            AccountServiceError.Unauthorized or AccountServiceError.RefreshTokenInvalid =>
                Unauthorized(message),
            _ => BadRequest(message ?? "Hesap işlemi tamamlanamadı.")
        };

    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        Response.Cookies.Append(
            _authCookieOptions.RefreshTokenCookieName,
            refreshToken,
            BuildRefreshTokenCookieOptions(expiresAt));
    }

    private void DeleteRefreshTokenCookie()
    {
        Response.Cookies.Delete(
            _authCookieOptions.RefreshTokenCookieName,
            BuildRefreshTokenCookieOptions(DateTimeOffset.UnixEpoch.UtcDateTime));
    }

    private CookieOptions BuildRefreshTokenCookieOptions(DateTime expiresAt) =>
        new()
        {
            Domain = null,
            Expires = new DateTimeOffset(expiresAt),
            HttpOnly = true,
            IsEssential = true,
            MaxAge = expiresAt > DateTime.UtcNow ? expiresAt - DateTime.UtcNow : TimeSpan.Zero,
            Path = string.IsNullOrWhiteSpace(_authCookieOptions.Path) ? "/" : _authCookieOptions.Path,
            SameSite = _authCookieOptions.SameSite,
            Secure = _authCookieOptions.Secure || !environment.IsDevelopment()
        };
}
