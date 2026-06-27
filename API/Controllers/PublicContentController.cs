using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public")]
public class PublicContentController(IPublicContentService publicContentService) : ControllerBase
{
    [HttpGet("question-bank")]
    public async Task<ActionResult<IReadOnlyList<PublicQuestionDto>>> GetQuestionBank(
        [FromQuery] Guid? topicId,
        [FromQuery] string? search,
        [FromQuery] ContentAccessLevel accessLevel = ContentAccessLevel.Free,
        CancellationToken cancellationToken = default)
    {
        if (!IsPublicAccessLevel(accessLevel))
        {
            return BadRequest(new { message = "Premium içerik public API üzerinden listelenemez." });
        }

        var items = await publicContentService.GetQuestionBankAsync(
            topicId,
            search,
            accessLevel,
            cancellationToken);

        return Ok(items);
    }

    [HttpPost("mini-quiz/start")]
    public async Task<ActionResult<IReadOnlyList<PublicQuestionDto>>> StartMiniQuiz(
        StartPublicMiniQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!IsPublicAccessLevel(dto.AccessLevel))
        {
            return BadRequest(new { message = "Premium içerik public mini quiz için kullanılamaz." });
        }

        var items = await publicContentService.StartMiniQuizAsync(dto, cancellationToken);
        return Ok(items);
    }

    [HttpPost("mini-quiz/submit")]
    public async Task<ActionResult<PublicMiniQuizResultDto>> SubmitMiniQuiz(
        SubmitPublicMiniQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        var result = await publicContentService.SubmitMiniQuizAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpGet("example-trials")]
    public async Task<ActionResult<IReadOnlyList<TrialExamSummaryDto>>> GetExampleTrials(
        [FromQuery] ContentAccessLevel accessLevel = ContentAccessLevel.Free,
        CancellationToken cancellationToken = default)
    {
        if (!IsPublicAccessLevel(accessLevel))
        {
            return BadRequest(new { message = "Premium denemeler public API üzerinden listelenemez." });
        }

        var items = await publicContentService.GetExampleTrialsAsync(accessLevel, cancellationToken);
        return Ok(items);
    }

    private static bool IsPublicAccessLevel(ContentAccessLevel accessLevel) =>
        accessLevel is ContentAccessLevel.Free or ContentAccessLevel.Trial;
}
