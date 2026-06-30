using API.Dtos;
using API.Entities;
using API.Services;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/import")]
public class AdminImportController(
    UserManager<AppUser> userManager,
    IQuestionImportService questionImportService,
    IAdminMaterialImportService materialImportService) : ControllerBase
{
    private const long MaxQuestionImportSizeInBytes = 10 * 1024 * 1024;

    [HttpPost("preview")]
    [RequestSizeLimit(MaxQuestionImportSizeInBytes)]
    public async Task<ActionResult<ImportPreviewDto>> Preview(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var preview = await questionImportService.PreviewAsync(file, cancellationToken);
        return Ok(preview);
    }

    [HttpPost("questions")]
    [RequestSizeLimit(MaxQuestionImportSizeInBytes)]
    public async Task<ActionResult<ImportJobDto>> ImportQuestions(
        [FromForm] ImportQuestionsRequestDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        IReadOnlyList<DuplicateImportDecisionDto>? duplicateDecisions = null;
        if (!string.IsNullOrWhiteSpace(dto.DuplicateActionsJson))
        {
            try
            {
                duplicateDecisions = JsonSerializer.Deserialize<IReadOnlyList<DuplicateImportDecisionDto>>(
                    dto.DuplicateActionsJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException)
            {
                return BadRequest(new { message = "Duplicate aksiyon verisi geÃ§ersiz." });
            }
        }

        var job = await questionImportService.CreateQuestionImportJobAsync(dto.File, adminId, duplicateDecisions, cancellationToken);
        return AcceptedAtAction(nameof(GetJob), new { jobId = job.Id }, job);
    }

    [HttpPost("materials")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<MaterialImportResultDto>> ImportMaterials(
        [FromForm] ImportMaterialRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await materialImportService.ImportMaterialsAsync(dto, cancellationToken);

        if (result.ImportedFiles == 1 && result.FailedFiles == 0 && result.Documents.Count == 1)
        {
            var document = result.Documents[0];
        return Created($"/api/source-documents/{document.Id}", result);
        }

        return Ok(result);
    }

    [HttpGet("jobs/{jobId:guid}")]
    public async Task<ActionResult<ImportJobDto>> GetJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await questionImportService.GetJobAsync(jobId, cancellationToken);
        return job is null ? NotFound(new { message = "Import job bulunamadı." }) : Ok(job);
    }

    [HttpPost("duplicate-check")]
    public async Task<ActionResult<ImportPreviewDto>> DuplicateCheck(
        DuplicateCheckRequestDto dto,
        CancellationToken cancellationToken)
    {
        var result = await questionImportService.DuplicateCheckAsync(dto.Rows, cancellationToken);
        return Ok(result);
    }
}
