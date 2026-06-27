using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/badges")]
public class AdminBadgesController(IBadgeManagementService badgeManagementService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BadgeDto>>> GetBadges(CancellationToken cancellationToken)
    {
        return Ok(await badgeManagementService.GetAllAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<BadgeDto>> CreateBadge(
        UpsertBadgeDto dto,
        CancellationToken cancellationToken)
    {
        var outcome = await badgeManagementService.CreateAsync(dto, cancellationToken);
        if (outcome.Error == BadgeManagementError.None && outcome.Result is not null)
        {
            return CreatedAtAction(nameof(GetBadges), new { id = outcome.Result.Id }, outcome.Result);
        }

        return ToActionResult(outcome.Error, outcome.Message);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BadgeDto>> UpdateBadge(
        Guid id,
        UpsertBadgeDto dto,
        CancellationToken cancellationToken)
    {
        var outcome = await badgeManagementService.UpdateAsync(id, dto, cancellationToken);
        if (outcome.Error == BadgeManagementError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToActionResult(outcome.Error, outcome.Message);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBadge(Guid id, CancellationToken cancellationToken)
    {
        var outcome = await badgeManagementService.DeleteAsync(id, cancellationToken);
        if (outcome.Error == BadgeManagementError.None)
        {
            return NoContent();
        }

        return ToActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToActionResult(BadgeManagementError error, string? message) =>
        error switch
        {
            BadgeManagementError.NotFound => NotFound(new { message }),
            BadgeManagementError.DuplicateName => Conflict(new { message }),
            BadgeManagementError.InUse => Conflict(new { message }),
            BadgeManagementError.InvalidInput => BadRequest(new { message }),
            _ => BadRequest(new { message = message ?? "Rozet işlemi tamamlanamadı." })
        };
}
