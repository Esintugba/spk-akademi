using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/source-documents")]
public class SourceDocumentsController(
    UserManager<AppUser> userManager,
    ISourceDocumentService sourceDocumentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SourceDocumentDto>>> GetSourceDocuments(
        [FromQuery] Guid? courseId,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var user = await userManager.GetUserAsync(User);
        var outcome = await sourceDocumentService.GetDocumentsAsync(userId, user, courseId, cancellationToken);

        return ToSourceDocumentListActionResult(outcome);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SourceDocumentDto>> GetSourceDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await sourceDocumentService.GetDocumentAsync(userId, id, cancellationToken);

        return ToSourceDocumentActionResult(outcome);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<SourceDocumentDto>> CreateSourceDocument(
        CreateSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await sourceDocumentService.CreateDocumentAsync(dto, cancellationToken);
        return ToSourceDocumentActionResult(outcome, created: true);
    }

    [HttpPost("upload")]
    [Authorize(Roles = AppRoles.Admin)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<SourceDocumentDto>> UploadSourceDocument(
        [FromForm] UploadSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await sourceDocumentService.UploadDocumentAsync(dto, cancellationToken);
        return ToSourceDocumentActionResult(outcome, created: true);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateSourceDocument(
        Guid id,
        UpdateSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await sourceDocumentService.UpdateDocumentAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpPut("{id:guid}/upload")]
    [Authorize(Roles = AppRoles.Admin)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<SourceDocumentDto>> ReplaceSourceDocumentFile(
        Guid id,
        [FromForm] UploadSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await sourceDocumentService.ReplaceDocumentFileAsync(id, dto, cancellationToken);
        return ToSourceDocumentActionResult(outcome);
    }

    [HttpPost("{id:guid}/extract-text")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<SourceDocumentTextDto>> ExtractSourceDocumentText(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await sourceDocumentService.ExtractTextAsync(id, cancellationToken);
        return ToSourceDocumentTextActionResult(outcome);
    }

    [HttpGet("{id:guid}/text")]
    public async Task<ActionResult<SourceDocumentTextDto>> GetSourceDocumentText(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await sourceDocumentService.GetTextAsync(userId, id, cancellationToken);

        return ToSourceDocumentTextActionResult(outcome);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> DownloadSourceDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await sourceDocumentService.GetDownloadAsync(userId, id, cancellationToken);

        if (outcome.Error == SourceDocumentError.None && outcome.Result is not null)
        {
            return PhysicalFile(outcome.Result.FullPath, outcome.Result.ContentType, outcome.Result.FileName);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteSourceDocument(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await sourceDocumentService.DeleteDocumentAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private ActionResult<IReadOnlyList<SourceDocumentDto>> ToSourceDocumentListActionResult(
        SourceDocumentOutcome<IReadOnlyList<SourceDocumentDto>> outcome)
    {
        if (outcome.Error == SourceDocumentError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult<SourceDocumentDto> ToSourceDocumentActionResult(
        SourceDocumentOutcome<SourceDocumentDto> outcome,
        bool created = false)
    {
        if (outcome.Error == SourceDocumentError.None && outcome.Result is not null)
        {
            return created
                ? CreatedAtAction(nameof(GetSourceDocument), new { id = outcome.Result.Id }, outcome.Result)
                : Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult<SourceDocumentTextDto> ToSourceDocumentTextActionResult(
        SourceDocumentOutcome<SourceDocumentTextDto> outcome)
    {
        if (outcome.Error == SourceDocumentError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(SourceDocumentOutcome<bool> outcome)
    {
        if (outcome.Error == SourceDocumentError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(SourceDocumentError error, string? message) =>
        error switch
        {
            SourceDocumentError.Unauthorized => Unauthorized(),
            SourceDocumentError.Forbidden => Forbid(),
            SourceDocumentError.NotFound => NotFound(),
            SourceDocumentError.FileMissing => NotFound(message ?? "Dosya bulunamadı."),
            _ => BadRequest(message ?? "Kaynak dökuman islemi tamamlanamadı.")
        };
}
