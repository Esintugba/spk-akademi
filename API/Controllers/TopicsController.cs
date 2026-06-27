using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/topics")]
public class TopicsController(
    UserManager<AppUser> userManager,
    ITopicManagementService topicManagementService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TopicDto>>> GetTopics(
        [FromQuery] Guid? courseId,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await topicManagementService.GetTopicsAsync(userId, courseId, cancellationToken);

        if (outcome.Error == TopicManagementError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TopicDto>> GetTopic(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await topicManagementService.GetTopicAsync(userId, id, cancellationToken);

        return ToTopicActionResult(outcome);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<TopicDto>> CreateTopic(
        CreateTopicDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await topicManagementService.CreateTopicAsync(dto, cancellationToken);
        return ToTopicActionResult(outcome, created: true);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateTopic(
        Guid id,
        UpdateTopicDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await topicManagementService.UpdateTopicAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteTopic(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await topicManagementService.DeleteTopicAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private ActionResult<TopicDto> ToTopicActionResult(
        TopicManagementOutcome<TopicDto> outcome,
        bool created = false)
    {
        if (outcome.Error == TopicManagementError.None && outcome.Result is not null)
        {
            return created
                ? CreatedAtAction(nameof(GetTopic), new { id = outcome.Result.Id }, outcome.Result)
                : Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(TopicManagementOutcome<bool> outcome)
    {
        if (outcome.Error == TopicManagementError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(TopicManagementError error, string? message) =>
        error switch
        {
            TopicManagementError.Unauthorized => Unauthorized(),
            TopicManagementError.Forbidden => Forbid(),
            TopicManagementError.NotFound => NotFound(),
            _ => BadRequest(message ?? "Konu işlemi tamamlanamadı.")
        };
}
