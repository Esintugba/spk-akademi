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
[Route("api/access-requests")]
public class AccessRequestsController(
    UserManager<AppUser> userManager,
    IAccessRequestService accessRequestService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<AccessRequestResponseDto>> Create(
        CreateAccessRequestDto dto,
        CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        var (error, result) = await accessRequestService.CreateAsync(studentId, dto, cancellationToken);

        return error switch
        {
            AccessRequestError.LicenseNotFound => NotFound(new { message = "Plan bulunamadı." }),
            AccessRequestError.AlreadyHasAccess => BadRequest(new { message = "Bu plan için zaten erişiminiz var." }),
            AccessRequestError.DuplicateRequest => BadRequest(new { message = "Bu plan için bekleyen bir başvurunuz zaten var." }),
            _ => Ok(result)
        };
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyList<AccessRequestResponseDto>>> GetMyRequests(
        CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        var result = await accessRequestService.GetMyRequestsAsync(studentId, cancellationToken);
        return Ok(result);
    }
}
