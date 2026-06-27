using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Student)]
[Route("api/student")]
public class StudentController(
    UserManager<AppUser> userManager,
    ILicenseAccessService accessService,
    IStudentExperienceService studentExperienceService,
    IQuizTrialService quizTrialService,
    IQuizCatalogService quizCatalogService,
    IQuizRecommendationService quizRecommendationService) : ControllerBase
{
    [HttpGet("my-trials")]
    public async Task<ActionResult<IReadOnlyList<StudentAccessibleTrialDto>>> GetMyTrials(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await quizTrialService.GetAccessibleTrialsAsync(userId, cancellationToken));
    }

    [HttpGet("quizzes")]
    public async Task<ActionResult<QuizCatalogResponseDto>> GetQuizzes(
        [FromQuery] QuizCatalogQueryDto query,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await quizCatalogService.GetCatalogAsync(userId, query, cancellationToken));
    }

    [HttpGet("quizzes/recommended")]
    public async Task<ActionResult<IReadOnlyList<FeaturedQuizDto>>> GetRecommendedQuizzes(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await quizRecommendationService.GetRecommendedAsync(userId, cancellationToken));
    }

    [HttpGet("program")]
    public async Task<ActionResult<StudentProgramDto>> GetProgram()
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await studentExperienceService.GetProgram(userId));
    }

    [HttpGet("topic-study/{topicId:guid}")]
    public async Task<ActionResult<TopicStudyPageDto>> GetTopicStudyPage(Guid topicId)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!await accessService.CanAccessTopic(userId, topicId))
        {
            return Forbid();
        }

        var page = await studentExperienceService.GetTopicStudyPage(userId, topicId);
        return page is null ? NotFound() : Ok(page);
    }

    [HttpPost("topic-study/{topicId:guid}/complete")]
    public async Task<IActionResult> MarkTopicCompleted(Guid topicId, MarkTopicCompletedDto dto)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!await accessService.CanAccessTopic(userId, topicId))
        {
            return Forbid();
        }

        await studentExperienceService.MarkTopicCompleted(userId, topicId, dto.IsCompleted);
        return NoContent();
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<StudentAnalyticsDto>> GetAnalytics()
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await studentExperienceService.GetAnalytics(userId));
    }

    [HttpGet("trial-history")]
    public async Task<ActionResult<IReadOnlyList<TrialAttemptSummaryDto>>> GetTrialHistory()
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await studentExperienceService.GetTrialHistory(userId));
    }

    [HttpGet("result-history")]
    public async Task<ActionResult<IReadOnlyList<QuizResultHistoryItemDto>>> GetResultHistory()
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await studentExperienceService.GetResultHistory(userId));
    }

    [HttpGet("trial-history/{attemptId:guid}")]
    public async Task<ActionResult<TrialAttemptDetailDto>> GetTrialHistoryDetail(Guid attemptId)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var detail = await studentExperienceService.GetTrialHistoryDetail(userId, attemptId);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpGet("trial-continue")]
    public async Task<ActionResult<StudentContinueTrialDto>> GetActiveTrial()
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var activeTrial = await studentExperienceService.GetActiveTrial(userId);
        return activeTrial is null ? NotFound() : Ok(activeTrial);
    }
}
