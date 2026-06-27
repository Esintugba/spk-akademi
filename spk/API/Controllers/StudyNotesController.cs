using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/study-notes")]
public class StudyNotesController(IStudyNoteManagementService studyNoteManagementService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<ActionResult<IReadOnlyList<PublicStudyNoteDto>>> GetPublicStudyNotes(
        [FromQuery] Guid? licenseId,
        [FromQuery] Guid? courseId,
        [FromQuery] Guid? topicId,
        [FromQuery] string? search,
        CancellationToken cancellationToken = default)
    {
        var notes = await studyNoteManagementService.GetPublicStudyNotesAsync(
            licenseId,
            courseId,
            topicId,
            search,
            cancellationToken);

        return Ok(notes);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StudyNoteDto>>> GetStudyNotes(
        [FromQuery] Guid? topicId,
        CancellationToken cancellationToken = default)
    {
        var outcome = await studyNoteManagementService.GetStudyNotesAsync(
            GetUserId(),
            User.IsInRole(AppRoles.Admin),
            topicId,
            cancellationToken);

        return ToListActionResult(outcome);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StudyNoteDto>> GetStudyNote(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await studyNoteManagementService.GetStudyNoteAsync(
            GetUserId(),
            User.IsInRole(AppRoles.Admin),
            id,
            cancellationToken);

        return ToDetailActionResult(outcome);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<StudyNoteDto>> CreateStudyNote(
        CreateStudyNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await studyNoteManagementService.CreateStudyNoteAsync(dto, cancellationToken);
        if (outcome.Error != StudyNoteManagementError.None)
        {
            return ToErrorActionResult(outcome.Error, outcome.Message);
        }

        return CreatedAtAction(
            nameof(GetStudyNote),
            new { id = outcome.Result!.Id },
            outcome.Result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateStudyNote(
        Guid id,
        UpdateStudyNoteDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await studyNoteManagementService.UpdateStudyNoteAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteStudyNote(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await studyNoteManagementService.DeleteStudyNoteAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    private ActionResult<IReadOnlyList<StudyNoteDto>> ToListActionResult(
        StudyNoteManagementOutcome<IReadOnlyList<StudyNoteDto>> outcome)
    {
        if (outcome.Error == StudyNoteManagementError.None)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult<StudyNoteDto> ToDetailActionResult(
        StudyNoteManagementOutcome<StudyNoteDto> outcome)
    {
        if (outcome.Error == StudyNoteManagementError.None)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(StudyNoteManagementOutcome<bool> outcome)
    {
        if (outcome.Error == StudyNoteManagementError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(StudyNoteManagementError error, string? message) =>
        error switch
        {
            StudyNoteManagementError.Unauthorized => Unauthorized(),
            StudyNoteManagementError.Forbidden => Forbid(),
            StudyNoteManagementError.NotFound => NotFound(),
            _ => BadRequest(message ?? "Çalışma notu işlemi tamamlanamadı.")
        };
}
