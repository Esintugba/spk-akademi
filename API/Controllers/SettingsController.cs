using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/settings")]
public class SettingsController(
    UserManager<AppUser> userManager,
    IUserSettingsService userSettingsService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserSettingsDto>> GetSettings(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await userSettingsService.GetAsync(userId, cancellationToken));
    }

    [HttpPut]
    public async Task<ActionResult<UserSettingsDto>> UpdateSettings(
        UpdateUserSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await userSettingsService.UpdateAsync(userId, dto, cancellationToken));
    }

    [HttpPut("preferences")]
    public async Task<ActionResult<UserSettingsDto>> UpdatePreferences(
        UpdateUserSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await userSettingsService.UpdateAsync(userId, dto, cancellationToken));
    }

    [HttpGet("security")]
    public async Task<ActionResult<UserSecuritySettingsDto>> GetSecurity(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await userSettingsService.GetSecurityAsync(userId, cancellationToken);
        return result is null ? Unauthorized() : Ok(result);
    }
}
