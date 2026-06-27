using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/moderation")]
public class ModerationController(
    IContentModerationService moderationService,
    UserManager<API.Entities.AppUser> userManager) : ControllerBase
{
    [HttpGet("items")]
    public async Task<ActionResult<ModerationListResponseDto>> GetItems(
        [FromQuery] ModerationContentType? contentType,
        [FromQuery] API.Entities.ReviewStatus? reviewStatus,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var response = await moderationService.GetItemsAsync(
            contentType,
            reviewStatus,
            search,
            Math.Max(page, 1),
            Math.Clamp(pageSize, 1, 100),
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<ModerationHistoryDto>>> GetHistory(
        [FromQuery] ModerationContentType contentType,
        [FromQuery] Guid contentId,
        CancellationToken cancellationToken = default)
    {
        var history = await moderationService.GetHistoryAsync(contentType, contentId, cancellationToken);
        return Ok(history);
    }

    [HttpPost("review")]
    public async Task<IActionResult> Review(
        ModerateContentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var reviewerId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(reviewerId))
        {
            return Unauthorized();
        }

        await moderationService.ModerateAsync(request, reviewerId, cancellationToken);
        return NoContent();
    }

    [HttpPost("bulk-review")]
    public async Task<IActionResult> BulkReview(
        BulkModerateContentRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var reviewerId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(reviewerId))
        {
            return Unauthorized();
        }

        await moderationService.BulkModerateAsync(request, reviewerId, cancellationToken);
        return NoContent();
    }
}
