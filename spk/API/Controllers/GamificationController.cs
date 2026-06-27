using API.Authorization;
using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.StudentOnly)]
[Route("api/gamification")]
public class GamificationController(
    UserManager<AppUser> userManager,
    IGamificationService gamificationService) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<GamificationProfileDto>> GetProfile(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await gamificationService.GetProfileAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("daily-login")]
    public async Task<ActionResult<GamificationProfileDto>> ClaimDailyLogin(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await gamificationService.ClaimDailyLoginAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("badges")]
    public async Task<ActionResult<IReadOnlyList<UserBadgeDto>>> GetBadges(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await gamificationService.GetBadgesAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("daily-goals")]
    public async Task<ActionResult<IReadOnlyList<DailyGoalDto>>> GetDailyGoals(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await gamificationService.GetDailyGoalsAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("leaderboard")]
    public async Task<ActionResult<IReadOnlyList<LeaderboardEntryDto>>> GetLeaderboard(
        [FromQuery] LeaderboardQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await gamificationService.GetLeaderboardAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("xp-history")]
    public async Task<ActionResult<XpHistoryResponseDto>> GetXpHistory(
        [FromQuery] XpHistoryQueryDto query,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await gamificationService.GetXpHistoryAsync(userId, query, cancellationToken);
        return Ok(result);
    }
}
