using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Student)]
[Route("api/goals")]
public class UserGoalsController(
    UserManager<AppUser> userManager,
    IUserGoalService userGoalService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserGoalDto>>> GetGoals(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await userGoalService.GetGoalsAsync(userId, cancellationToken));
    }

    [HttpGet("{goalId:guid}")]
    public async Task<ActionResult<UserGoalDto>> GetGoal(Guid goalId, CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var goal = await userGoalService.GetGoalAsync(userId, goalId, cancellationToken);
        return goal is null ? NotFound() : Ok(goal);
    }

    [HttpPost]
    public async Task<ActionResult<UserGoalDto>> CreateGoal(CreateUserGoalDto dto, CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var goal = await userGoalService.CreateGoalAsync(userId, dto, cancellationToken);
            return CreatedAtAction(nameof(GetGoal), new { goalId = goal.Id }, goal);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{goalId:guid}")]
    public async Task<ActionResult<UserGoalDto>> UpdateGoal(
        Guid goalId,
        UpdateUserGoalDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var goal = await userGoalService.UpdateGoalAsync(userId, goalId, dto, cancellationToken);
            return goal is null ? NotFound() : Ok(goal);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{goalId:guid}")]
    public async Task<IActionResult> DeleteGoal(Guid goalId, CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return await userGoalService.DeleteGoalAsync(userId, goalId, cancellationToken)
            ? NoContent()
            : NotFound();
    }
}
