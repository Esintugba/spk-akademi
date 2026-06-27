using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/support-tickets")]
public class AdminSupportTicketsController(
    UserManager<AppUser> userManager,
    ISupportTicketService supportTicketService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<SupportTicketListDto>> GetTickets(
        [FromQuery] SupportTicketQueryDto query,
        CancellationToken cancellationToken)
    {
        return Ok(await supportTicketService.GetAdminTicketsAsync(query, cancellationToken));
    }

    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<AdminSupportDashboardDto>> GetDashboardSummary(CancellationToken cancellationToken)
    {
        return Ok(await supportTicketService.GetAdminDashboardAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupportTicketDetailDto>> GetTicket(Guid id, CancellationToken cancellationToken)
    {
        var (error, result) = await supportTicketService.GetAdminTicketAsync(id, cancellationToken);
        return ToActionResult(error, result);
    }

    [HttpPost("{id:guid}/messages")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<SupportTicketDetailDto>> AddMessage(
        Guid id,
        [FromForm] CreateSupportTicketMessageDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var (error, result) = await supportTicketService.AddAdminMessageAsync(adminId, id, dto, cancellationToken);
        return ToActionResult(error, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SupportTicketDetailDto>> UpdateTicket(
        Guid id,
        AdminUpdateSupportTicketDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var (error, result) = await supportTicketService.UpdateAdminTicketAsync(adminId, id, dto, cancellationToken);
        return ToActionResult(error, result);
    }

    private ActionResult<SupportTicketDetailDto> ToActionResult(SupportTicketError error, SupportTicketDetailDto? result) =>
        error switch
        {
            SupportTicketError.NotFound => NotFound(new { message = "Destek talebi bulunamadı." }),
            SupportTicketError.InvalidState => Conflict(new { message = "Kapalı destek talebine mesaj eklenemez." }),
            SupportTicketError.InvalidAttachment => BadRequest(new { message = "Dosya eki geçersiz. En fazla 8MB; jpg, png, webp, pdf, doc, docx veya txt yükleyin." }),
            _ => Ok(result)
        };
}
