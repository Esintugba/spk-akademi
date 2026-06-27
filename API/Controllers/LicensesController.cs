using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/licenses")]
public class LicensesController(
    IQuizCatalogService quizCatalogService,
    ILicenseCatalogService licenseCatalogService,
    ILicenseManagementService licenseManagementService,
    UserManager<AppUser> userManager) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("catalog")]
    public async Task<ActionResult<IReadOnlyList<LicenseCatalogDto>>> GetCatalog(
        CancellationToken cancellationToken)
    {
        return Ok(await licenseCatalogService.GetCatalogAsync(userManager.GetUserId(User), cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("catalog/{slug}")]
    public async Task<ActionResult<LicenseCatalogDto>> GetCatalogBySlug(
        string slug,
        CancellationToken cancellationToken)
    {
        var license = await licenseCatalogService.GetBySlugAsync(slug, userManager.GetUserId(User), cancellationToken);
        return license is null ? NotFound() : Ok(license);
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LicenseDto>>> GetLicenses(
        CancellationToken cancellationToken = default)
    {
        return Ok(await licenseManagementService.GetLicensesAsync(cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LicenseCatalogDto>> GetLicense(
        Guid id,
        CancellationToken cancellationToken)
    {
        var license = await licenseCatalogService.GetByIdAsync(id, userManager.GetUserId(User), cancellationToken);

        return license is null ? NotFound() : Ok(license);
    }

    [Authorize(Roles = AppRoles.Student)]
    [HttpGet("{id:guid}/quizzes")]
    public async Task<ActionResult<QuizCatalogResponseDto>> GetLicenseQuizzes(
        Guid id,
        [FromQuery] QuizCatalogQueryDto query,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await quizCatalogService.GetLicenseCatalogAsync(userId, id, query, cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<LicenseDto>> CreateLicense(
        CreateLicenseDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await licenseManagementService.CreateLicenseAsync(dto, cancellationToken);

        if (outcome.Error == LicenseManagementError.None && outcome.Result is not null)
        {
            return CreatedAtAction(nameof(GetLicense), new { id = outcome.Result.Id }, outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateLicense(
        Guid id,
        UpdateLicenseDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await licenseManagementService.UpdateLicenseAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteLicense(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await licenseManagementService.DeleteLicenseAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private IActionResult ToEmptyActionResult(LicenseManagementOutcome<bool> outcome)
    {
        if (outcome.Error == LicenseManagementError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(LicenseManagementError error, string? message) =>
        error switch
        {
            LicenseManagementError.NotFound => NotFound(),
            _ => BadRequest(message ?? "Lisans işlemi tamamlanamadı.")
        };
}
