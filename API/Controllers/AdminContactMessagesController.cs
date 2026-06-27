using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/contact-messages")]
public class AdminContactMessagesController(IContactService contactService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AdminContactMessageListDto>> GetMessages(
        [FromQuery] ContactMessageQueryDto query,
        CancellationToken cancellationToken)
    {
        var result = await contactService.GetAdminMessagesAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminContactMessageDto>> GetMessage(
        Guid id,
        CancellationToken cancellationToken)
    {
        var (error, result) = await contactService.GetAdminMessageAsync(id, cancellationToken);
        return error == ContactMessageError.NotFound
            ? NotFound(new { message = "Mesaj bulunamadı." })
            : Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<AdminContactMessageDto>> UpdateStatus(
        Guid id,
        UpdateContactMessageStatusDto dto,
        CancellationToken cancellationToken)
    {
        var (error, result) = await contactService.UpdateStatusAsync(id, dto, cancellationToken);
        return error == ContactMessageError.NotFound
            ? NotFound(new { message = "Mesaj bulunamadı." })
            : Ok(result);
    }
}
