using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/access-requests")]
public class AdminAccessRequestsController(
    UserManager<AppUser> userManager,
    IAccessRequestService accessRequestService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AdminAccessRequestListDto>> GetQueue(
        [FromQuery] AccessRequestQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await accessRequestService.GetAdminQueueAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<AdminAccessRequestDto>> UpdateStatus(
        Guid id,
        UpdateAccessRequestStatusDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var (error, result) = await accessRequestService.UpdateStatusAsync(id, adminId, dto, cancellationToken);

        return error switch
        {
            AccessRequestError.NotFound => NotFound(new { message = "Başvuru bulunamadı." }),
            AccessRequestError.InvalidStatusTransition => BadRequest(new { message = "Bu başvuru için durum güncellenemez." }),
            _ => Ok(result)
        };
    }

    [HttpPatch("{id:guid}/decision")]
    public async Task<ActionResult<AdminAccessRequestDto>> CorrectDecision(
        Guid id,
        CorrectAccessRequestDecisionDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var (error, result) = await accessRequestService.CorrectDecisionAsync(
            id,
            adminId,
            dto,
            cancellationToken);

        return error switch
        {
            AccessRequestError.NotFound => NotFound(new { message = "Başvuru bulunamadı." }),
            AccessRequestError.InvalidStatusTransition => BadRequest(new { message = "Bu karar belirtilen duruma düzeltilemez." }),
            AccessRequestError.AccessChangedSinceApproval => Conflict(new
            {
                message = "Onaydan sonra lisans erişimi elle değiştirilmiş. Başka bir erişimi yanlışlıkla kaldırmamak için düzeltme durduruldu."
            }),
            _ => Ok(result)
        };
    }
}
