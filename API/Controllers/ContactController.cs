using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/contact")]
public class ContactController(IContactService contactService) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<ActionResult<ContactMessageResponseDto>> Create(
        CreateContactMessageDto dto,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var (error, result) = await contactService.CreateAsync(dto, ipAddress, userAgent, cancellationToken);

        return error switch
        {
            ContactMessageError.Spam => Accepted(new ContactMessageResponseDto(Guid.Empty, "Mesajınız başarıyla gönderildi.")),
            ContactMessageError.CaptchaInvalid => BadRequest(new { message = "Güvenlik doğrulaması başarısız." }),
            ContactMessageError.RateLimited => StatusCode(StatusCodes.Status429TooManyRequests, new { message = "Çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin." }),
            ContactMessageError.Duplicate => Conflict(new { message = "Bu mesaj zaten alındı gibi görünüyor." }),
            _ => Ok(result)
        };
    }
}
