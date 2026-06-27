using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/questions")]
public class QuestionsController(IQuestionService questionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QuestionDto>>> GetQuestions(
        [FromQuery] Guid? topicId,
        [FromQuery] ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default)
    {
        var questions = await questionService.GetQuestionsAsync(topicId, reviewStatus, cancellationToken);
        return Ok(questions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuestionDto>> GetQuestion(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await questionService.GetQuestionAsync(id, cancellationToken);
        return ToQuestionActionResult(outcome);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<QuestionDto>> CreateQuestion(
        CreateQuestionDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await questionService.CreateQuestionAsync(dto, cancellationToken);
        return ToQuestionActionResult(outcome, created: true);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateQuestion(
        Guid id,
        UpdateQuestionDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await questionService.UpdateQuestionAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteQuestion(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await questionService.DeleteQuestionAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private ActionResult<QuestionDto> ToQuestionActionResult(
        QuestionServiceOutcome<QuestionDto> outcome,
        bool created = false)
    {
        if (outcome.Error == QuestionServiceError.None && outcome.Result is not null)
        {
            return created
                ? CreatedAtAction(nameof(GetQuestion), new { id = outcome.Result.Id }, outcome.Result)
                : Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(QuestionServiceOutcome<bool> outcome)
    {
        if (outcome.Error == QuestionServiceError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(QuestionServiceError error, string? message) =>
        error switch
        {
            QuestionServiceError.NotFound => NotFound(),
            _ => BadRequest(message ?? "Soru işlemi tamamlanamadı.")
        };
}
