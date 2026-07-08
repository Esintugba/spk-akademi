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
[Route("api/support/tickets")]
public class SupportTicketsController(
    UserManager<AppUser> userManager,
    ISupportTicketService supportTicketService) : ControllerBase
{
    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyList<SupportTicketSummaryDto>>> GetMyTickets(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await supportTicketService.GetMyTicketsAsync(userId, cancellationToken));
    }

    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<StudentSupportDashboardDto>> GetDashboardSummary(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await supportTicketService.GetStudentDashboardAsync(userId, cancellationToken));
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<SupportTicketDetailDto>> CreateTicket(
        [FromForm] CreateSupportTicketDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var (error, result) = await supportTicketService.CreateTicketAsync(userId, dto, cancellationToken);
        return ToActionResult(error, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupportTicketDetailDto>> GetTicket(Guid id, CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var (error, result) = await supportTicketService.GetMyTicketAsync(userId, id, cancellationToken);
        return ToActionResult(error, result);
    }

    [HttpPost("{id:guid}/messages")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<SupportTicketDetailDto>> AddMessage(
        Guid id,
        [FromForm] CreateSupportTicketMessageDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var (error, result) = await supportTicketService.AddUserMessageAsync(userId, id, dto, cancellationToken);
        return ToActionResult(error, result);
    }

    [HttpGet("{id:guid}/attachments/{fileName}")]
    public async Task<IActionResult> DownloadAttachment(
        Guid id,
        string fileName,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var (error, result) = await supportTicketService.GetUserAttachmentAsync(
            userId,
            id,
            fileName,
            cancellationToken);
        if (error == SupportTicketError.None && result is not null)
        {
            return PhysicalFile(result.FullPath, result.ContentType, result.FileName);
        }

        return ToDownloadActionResult(error);
    }

    private ActionResult<SupportTicketDetailDto> ToActionResult(SupportTicketError error, SupportTicketDetailDto? result) =>
        error switch
        {
            SupportTicketError.NotFound => NotFound(new { message = "Destek talebi bulunamadı." }),
            SupportTicketError.Forbidden => Forbid(),
            SupportTicketError.InvalidState => Conflict(new { message = "Kapalı destek talebine mesaj eklenemez." }),
            SupportTicketError.InvalidAttachment => BadRequest(new { message = "Dosya eki geçersiz. En fazla 8MB; jpg, png, webp, pdf, doc, docx veya txt yükleyin." }),
            _ => Ok(result)
        };

    private IActionResult ToDownloadActionResult(SupportTicketError error) =>
        error switch
        {
            SupportTicketError.Forbidden => Forbid(),
            _ => NotFound(new { message = "Dosya eki bulunamadı." })
        };
}
