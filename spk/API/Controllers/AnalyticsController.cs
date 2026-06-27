using API.Authorization;
using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.StudentOnly)]
[Route("api/analytics")]
public class AnalyticsController(
    UserManager<AppUser> userManager,
    IExamAnalyticsService examAnalyticsService,
    IQuizCatalogService quizCatalogService) : ControllerBase
{
    [HttpGet("past-exams")]
    public async Task<ActionResult<PastExamAnalyticsDto>> GetPastExamAnalytics(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await examAnalyticsService.GetPastExamAnalyticsAsync(userId, cancellationToken));
    }

    [HttpGet("quizzes")]
    public async Task<ActionResult<IReadOnlyList<QuizAnalyticsDto>>> GetQuizAnalytics(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await quizCatalogService.GetAnalyticsAsync(userId, cancellationToken));
    }
}
