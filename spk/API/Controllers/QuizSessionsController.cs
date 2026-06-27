using API.Authorization;
using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/quizzes")]
public class QuizSessionsController(
    UserManager<AppUser> userManager,
    IQuizSessionResolverService sessionResolver) : ControllerBase
{
    [HttpGet("session/{attemptId:guid}")]
    public async Task<ActionResult<QuizSessionDto>> GetSession(
        Guid attemptId,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);

        var session = await sessionResolver.ResolveQuizAttemptAsync(
            attemptId,
            userId,
            touchActivity: true,
            cancellationToken);

        if (session is not null)
        {
            return Ok(session);
        }

        if (!string.IsNullOrWhiteSpace(userId))
        {
            var reviewSession = await sessionResolver.ResolveReviewSessionAsync(
                attemptId,
                userId,
                touchActivity: true,
                cancellationToken);

            if (reviewSession is not null)
            {
                return Ok(reviewSession);
            }
        }

        return NotFound(new { message = "Oturum bulunamadı veya erişim izniniz yok." });
    }

    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpGet("active")]
    public async Task<ActionResult<IReadOnlyList<ActiveQuizAttemptDto>>> GetActiveSessions(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var sessions = await sessionResolver.GetActiveSessionsAsync(userId, cancellationToken);
        return Ok(sessions);
    }
}
