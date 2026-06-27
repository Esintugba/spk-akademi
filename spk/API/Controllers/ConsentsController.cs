using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/consents")]
public class ConsentsController(IConsentService consentService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("cookie")]
    public async Task<IActionResult> SaveCookieConsent(
        CookieConsentDto dto,
        CancellationToken cancellationToken)
    {
        await consentService.SaveCookieConsentAsync(
            dto,
            GetUserId(),
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            cancellationToken);

        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("kvkk")]
    public async Task<IActionResult> SaveKvkkConsent(
        KvkkConsentDto dto,
        CancellationToken cancellationToken)
    {
        var outcome = await consentService.SaveKvkkConsentAsync(
            dto,
            GetUserId(),
            HttpContext.Connection.RemoteIpAddress?.ToString(),
            Request.Headers.UserAgent.ToString(),
            cancellationToken);

        if (outcome.Error == ConsentError.None)
        {
            return NoContent();
        }

        return BadRequest(new { message = outcome.Message });
    }

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);
}

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/consents")]
public class AdminConsentsController(IConsentAdminService consentAdminService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ConsentSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await consentAdminService.GetSummaryAsync(cancellationToken);
        return Ok(summary);
    }
}
