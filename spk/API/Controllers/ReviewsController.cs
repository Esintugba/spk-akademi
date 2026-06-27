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
[Route("api/reviews")]
public class ReviewsController(
    UserManager<AppUser> userManager,
    IReviewSessionService reviewSessionService,
    IGamificationRewardService gamificationRewardService) : ControllerBase
{
    [HttpGet("today")]
    public async Task<ActionResult<TodayReviewDto>> GetToday(CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        var result = await reviewSessionService.GetTodayAsync(studentId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("start")]
    public async Task<ActionResult<ReviewSessionResponseDto>> StartSession(
        StartReviewSessionRequestDto request,
        CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await reviewSessionService.StartSessionAsync(studentId, request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("submit")]
    public async Task<ActionResult<SubmitReviewSessionResultDto>> SubmitSession(
        SubmitReviewSessionDto request,
        CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await reviewSessionService.SubmitSessionAsync(studentId, request, cancellationToken);
            var unlockedBadges = await gamificationRewardService.ApplyReviewCompletionAsync(
                new ReviewCompletedEvent(
                    studentId,
                    result.SessionId,
                    result.QuestionCount,
                    result.RetentionRate,
                    DateTime.UtcNow),
                cancellationToken);
            return Ok(result with { UnlockedBadges = ToUnlockedBadgeDtos(unlockedBadges) });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ReviewStatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        var result = await reviewSessionService.GetStatsAsync(studentId, cancellationToken);
        return Ok(result);
    }

    private static IReadOnlyList<UnlockedBadgeDto> ToUnlockedBadgeDtos(IReadOnlyList<UserBadge> unlockedBadges) =>
        unlockedBadges
            .Where(x => x.Badge is not null)
            .Select(x => new UnlockedBadgeDto(
                x.BadgeId,
                x.Badge!.Name,
                x.Badge.Description,
                x.Badge.IconUrl,
                x.Badge.XPReward,
                x.Badge.Category,
                x.UnlockedAt))
            .ToList();
}
