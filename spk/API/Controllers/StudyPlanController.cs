using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Student)]
[Route("api/study-plan")]
public class StudyPlanController(
    UserManager<AppUser> userManager,
    IAdaptiveStudyPlanService adaptiveStudyPlanService) : ControllerBase
{
    [HttpGet("today")]
    public async Task<ActionResult<AdaptiveStudyPlanDto>> GetToday(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await adaptiveStudyPlanService.GetTodayAsync(userId, cancellationToken));
    }

    [HttpGet("week")]
    public async Task<ActionResult<IReadOnlyList<AdaptiveStudyPlanDto>>> GetWeek(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await adaptiveStudyPlanService.GetWeekAsync(userId, cancellationToken));
    }

    [HttpPost("regenerate")]
    public async Task<ActionResult<AdaptiveStudyPlanDto>> Regenerate(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await adaptiveStudyPlanService.RegenerateTodayAsync(userId, cancellationToken));
    }

    [HttpPost("tasks/{taskId:guid}/complete")]
    public async Task<ActionResult<AdaptiveStudyPlanDto>> CompleteTask(
        Guid taskId,
        CompleteAdaptiveStudyTaskDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var plan = await adaptiveStudyPlanService.CompleteTaskAsync(userId, taskId, dto, cancellationToken);
        return plan is null ? NotFound() : Ok(plan);
    }

    [HttpGet("recommendations")]
    public async Task<ActionResult<IReadOnlyList<AdaptiveStudyRecommendationDto>>> GetRecommendations(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await adaptiveStudyPlanService.GetRecommendationsAsync(userId, cancellationToken));
    }
}
