using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/ai-question-generation")]
public class AdminAiQuestionGenerationController(
    UserManager<AppUser> userManager,
    IAiQuestionGenerationService service) : ControllerBase
{
    [HttpPost("jobs")]
    [EnableRateLimiting("ai-generation")]
    public async Task<ActionResult<AiQuestionGenerationJobDto>> CreateJob(
        CreateAiQuestionGenerationJobDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        try
        {
            var job = await service.CreateJobAsync(dto, adminId, cancellationToken);
            return AcceptedAtAction(nameof(GetJob), new { jobId = job.Id }, job);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("jobs/{jobId:guid}")]
    public async Task<ActionResult<AiQuestionGenerationJobDto>> GetJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await service.GetJobAsync(jobId, cancellationToken);
        return job is null ? NotFound(new { message = "Üretim işi bulunamadı." }) : Ok(job);
    }

    [HttpGet("jobs")]
    public async Task<ActionResult<IReadOnlyList<AiQuestionGenerationJobDto>>> GetJobs(
        [FromQuery] int take = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await service.GetJobsAsync(take, cancellationToken));

    [HttpGet("jobs/{jobId:guid}/drafts")]
    public async Task<ActionResult<IReadOnlyList<AiQuestionDraftDto>>> GetDrafts(
        Guid jobId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetDraftsAsync(jobId, cancellationToken));

    [HttpPut("drafts/{draftId:guid}")]
    public async Task<ActionResult<AiQuestionDraftDto>> UpdateDraft(
        Guid draftId,
        UpdateAiQuestionDraftDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        try
        {
            var draft = await service.UpdateDraftAsync(draftId, dto, adminId, cancellationToken);
            return draft is null ? NotFound(new { message = "Taslak bulunamadı." }) : Ok(draft);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("jobs/{jobId:guid}/publish")]
    public async Task<ActionResult<object>> PublishDrafts(
        Guid jobId,
        PublishAiQuestionDraftsDto dto,
        CancellationToken cancellationToken)
    {
        var adminId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        try
        {
            var publishedCount = await service.PublishDraftsAsync(
                jobId,
                dto,
                adminId,
                cancellationToken);
            return Ok(new { publishedCount });
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
