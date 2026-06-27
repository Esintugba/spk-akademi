using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize]
[Route("api/user-license-accesses")]
public class UserLicenseAccessesController(
    UserManager<AppUser> userManager,
    IUserLicenseAccessManagementService accessManagementService) : ControllerBase
{
    [HttpGet("me")]
    [Authorize(Roles = AppRoles.AdminAndStudent)]
    public async Task<ActionResult<IReadOnlyList<MyLicenseAccessDto>>> GetMyLicenseAccesses(
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await accessManagementService.GetMyAccessesAsync(userId, cancellationToken);

        if (outcome.Error == UserLicenseAccessManagementError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [HttpGet("users")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<IReadOnlyList<UserSummaryDto>>> GetUsers(
        CancellationToken cancellationToken = default)
    {
        var users = await accessManagementService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<IReadOnlyList<UserLicenseAccessDto>>> GetUserLicenseAccesses(
        CancellationToken cancellationToken = default)
    {
        var accesses = await accessManagementService.GetAccessesAsync(cancellationToken);
        return Ok(accesses);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<UserLicenseAccessDto>> CreateUserLicenseAccess(
        CreateUserLicenseAccessDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await accessManagementService.CreateAccessAsync(dto, cancellationToken);

        if (outcome.Error == UserLicenseAccessManagementError.None && outcome.Result is not null)
        {
            return CreatedAtAction(nameof(GetUserLicenseAccesses), new { id = outcome.Result.Id }, outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateUserLicenseAccess(
        Guid id,
        UpdateUserLicenseAccessDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await accessManagementService.UpdateAccessAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteUserLicenseAccess(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await accessManagementService.DeleteAccessAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private IActionResult ToEmptyActionResult(UserLicenseAccessManagementOutcome<bool> outcome)
    {
        if (outcome.Error == UserLicenseAccessManagementError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(UserLicenseAccessManagementError error, string? message) =>
        error switch
        {
            UserLicenseAccessManagementError.Unauthorized => Unauthorized(),
            UserLicenseAccessManagementError.NotFound => NotFound(),
            UserLicenseAccessManagementError.PaymentDisabled => BadRequest(message),
            _ => BadRequest(message ?? "Lisans erişimi işlemi tamamlanamadı.")
        };
}
