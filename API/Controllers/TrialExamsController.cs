using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/trial-exams")]
public class TrialExamsController(ITrialExamManagementService trialExamManagementService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TrialExamSummaryDto>>> GetTrialExams(
        CancellationToken cancellationToken = default)
    {
        var exams = await trialExamManagementService.GetTrialExamsAsync(cancellationToken);
        return Ok(exams);
    }

    [AllowAnonymous]
    [HttpGet("free")]
    public async Task<ActionResult<IReadOnlyList<TrialExamSummaryDto>>> GetFreeTrialExams(
        CancellationToken cancellationToken = default)
    {
        var exams = await trialExamManagementService.GetFreeTrialExamsAsync(cancellationToken);
        return Ok(exams);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TrialExamDetailDto>> GetTrialExam(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await trialExamManagementService.GetTrialExamAsync(id, cancellationToken);
        return ToDetailActionResult(outcome);
    }

    [HttpPost]
    public async Task<ActionResult<TrialExamDetailDto>> CreateTrialExam(
        CreateTrialExamDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await trialExamManagementService.CreateTrialExamAsync(dto, cancellationToken);
        if (outcome.Error != TrialExamManagementError.None)
        {
            return ToErrorActionResult(outcome.Error, outcome.Message);
        }

        return CreatedAtAction(
            nameof(GetTrialExam),
            new { id = outcome.Result!.Id },
            outcome.Result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTrialExam(
        Guid id,
        UpdateTrialExamDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await trialExamManagementService.UpdateTrialExamAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTrialExam(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await trialExamManagementService.DeleteTrialExamAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private ActionResult<TrialExamDetailDto> ToDetailActionResult(
        TrialExamManagementOutcome<TrialExamDetailDto> outcome)
    {
        if (outcome.Error == TrialExamManagementError.None)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(TrialExamManagementOutcome<bool> outcome)
    {
        if (outcome.Error == TrialExamManagementError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(TrialExamManagementError error, string? message) =>
        error switch
        {
            TrialExamManagementError.NotFound => NotFound(),
            _ => BadRequest(message ?? "Deneme sımavı işlemi tamamlanamadı.")
        };
}
