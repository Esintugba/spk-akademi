using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController(
    UserManager<AppUser> userManager,
    IAccountService accountService) : ControllerBase
{
    [HttpPost("register")]
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
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var outcome = await accountService.LoginAsync(dto);
        return ToAuthActionResult(outcome);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshTokenDto dto)
    {
        var outcome = await accountService.RefreshAsync(dto);
        return ToAuthActionResult(outcome);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await accountService.ForgotPasswordAsync(dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpPost("reset-password")]
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
        return ToEmptyActionResult(outcome);
    }

    [Authorize(Roles = AppRoles.AdminAndStudent)]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll()
    {
        var user = await userManager.GetUserAsync(User);
        var outcome = await accountService.LogoutAllAsync(user);
        return ToEmptyActionResult(outcome);
    }

    private ActionResult<AuthResponseDto> ToAuthActionResult(AccountServiceOutcome<AuthResponseDto> outcome)
    {
        if (outcome.Error == AccountServiceError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
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
}
