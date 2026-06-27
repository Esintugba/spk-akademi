using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/error")]
public class ErrorController(IHostEnvironment environment) : ControllerBase
{
    [HttpGet("bad-request")]
    public ActionResult GetBadRequest()
    {
        if (!IsEnabled())
        {
            return NotFound();
        }

        return BadRequest("This is a test bad request response.");
    }

    [HttpGet("unauthorized")]
    public ActionResult GetUnauthorized()
    {
        if (!IsEnabled())
        {
            return NotFound();
        }

        return Unauthorized("This is a test unauthorized response.");
    }

    [HttpGet("not-found")]
    public ActionResult GetNotFound()
    {
        if (!IsEnabled())
        {
            return NotFound();
        }

        return NotFound("This is a test not found response.");
    }

    [HttpGet("server-error")]
    public ActionResult GetServerError()
    {
        if (!IsEnabled())
        {
            return NotFound();
        }

        throw new InvalidOperationException("This is a test server error response.");
    }

    [HttpGet("validation-error")]
    public ActionResult GetValidationError()
    {
        if (!IsEnabled())
        {
            return NotFound();
        }

        ModelState.AddModelError("Title", "Title is required.");
        ModelState.AddModelError("Description", "Description must be at least 10 characters.");

        return ValidationProblem(ModelState);
    }

    [Authorize]
    [HttpGet("auth-required")]
    public ActionResult GetAuthRequired()
    {
        if (!IsEnabled())
        {
            return NotFound();
        }

        return Ok("This endpoint is for authenticated users only.");
    }

    private bool IsEnabled()
    {
        return environment.IsDevelopment();
    }
}
