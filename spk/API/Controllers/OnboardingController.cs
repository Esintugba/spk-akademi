using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Student)]
[Route("api/onboarding")]
public class OnboardingController(
    UserManager<AppUser> userManager,
    IOnboardingService onboardingService) : ControllerBase
{
    [HttpGet("status")]
    public async Task<ActionResult<OnboardingStatusDto>> GetStatus(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await onboardingService.GetStatusAsync(userId, cancellationToken));
    }

    [HttpPost("complete")]
    public async Task<ActionResult<OnboardingStatusDto>> Complete(
        [FromBody] CompleteOnboardingDto? dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await onboardingService.CompleteOnboardingAsync(
            userId,
            dto?.CurrentStep,
            cancellationToken));
    }
}
