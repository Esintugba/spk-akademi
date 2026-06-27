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
public class QuizzesController(
    UserManager<AppUser> userManager,
    IQuizTrialService quizTrialService,
    IQuizResultService quizResultService,
    IQuizCatalogService quizCatalogService,
    IQuizAttemptService quizAttemptService) : ControllerBase
{
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpGet("featured")]
    public async Task<ActionResult<IReadOnlyList<FeaturedQuizDto>>> GetFeaturedQuizzes(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await quizCatalogService.GetFeaturedAsync(userId, cancellationToken));
    }

    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpGet("{quizId:guid}/overview")]
    public async Task<ActionResult<QuizOverviewDto>> GetQuizOverview(
        Guid quizId,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var overview = await quizCatalogService.GetOverviewAsync(userId, quizId, cancellationToken);
        return overview is null ? NotFound() : Ok(overview);
    }

    [HttpGet("results/{attemptId:guid}")]
    public async Task<ActionResult<QuizResultDetailDto>> GetQuizResultDetail(
        Guid attemptId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeExplanations = true,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await quizResultService.GetResultDetailAsync(
            attemptId,
            userId,
            page,
            pageSize,
            includeExplanations,
            cancellationToken);

        return outcome.Error switch
        {
            QuizResultDetailError.NotFound => NotFound("Quiz sonucu bulunamadı."),
            QuizResultDetailError.NotCompleted => BadRequest("Bu test henüz tamamlanmadı."),
            QuizResultDetailError.Forbidden => Forbid(),
            _ => Ok(outcome.Result)
        };
    }

    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpPost("trial/start")]
    public async Task<ActionResult<QuizAttemptResponseDto>> StartLicensedTrial(
        StartLicensedQuizRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var outcome = await quizTrialService.StartLicensedTrialAsync(userId, dto.QuizId, cancellationToken);

        return outcome.Error switch
        {
            TrialStartError.NotFound => NotFound("Deneme sınavı bulunamadı veya yayında değil."),
            TrialStartError.Forbidden => Forbid(),
            TrialStartError.NoQuestions => BadRequest("Bu deneme sınavı için soru bulunamadı."),
            TrialStartError.DemoLimitReached => BadRequest("Demo deneme hakkınız doldu. Tam erişim için erişim talebi oluşturabilirsiniz."),
            _ => Ok(outcome.Response)
        };
    }

    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpPost("free-trial/start")]
    public async Task<ActionResult<QuizAttemptDto>> StartFreeTrialExam(
        StartFreeTrialExamDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await quizAttemptService.StartFreeTrialAsync(userId, dto, cancellationToken);

        return ToQuizAttemptActionResult(outcome, created: true);
    }

    [HttpPost("start")]
    public async Task<ActionResult<QuizAttemptDto>> StartQuiz(
        StartQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var user = await userManager.GetUserAsync(User);
        var outcome = await quizAttemptService.StartPracticeAsync(userId, user, dto, cancellationToken);

        return ToQuizAttemptActionResult(outcome, created: true);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuizAttemptDto>> GetQuizAttempt(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await quizAttemptService.GetAttemptAsync(userId, id, cancellationToken);

        return ToQuizAttemptActionResult(outcome);
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<ActionResult<QuizResultDto>> SubmitQuiz(
        Guid id,
        SubmitQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await quizAttemptService.SubmitAsync(userId, id, dto, cancellationToken);

        return ToQuizResultActionResult(outcome);
    }

    private ActionResult<QuizAttemptDto> ToQuizAttemptActionResult(
        QuizAttemptOutcome<QuizAttemptDto> outcome,
        bool created = false)
    {
        if (outcome.Error == QuizAttemptError.None && outcome.Result is not null)
        {
            return created
                ? CreatedAtAction(nameof(GetQuizAttempt), new { id = outcome.Result.Id }, outcome.Result)
                : Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult<QuizResultDto> ToQuizResultActionResult(QuizAttemptOutcome<QuizResultDto> outcome)
    {
        if (outcome.Error == QuizAttemptError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(QuizAttemptError error, string? message) =>
        error switch
        {
            QuizAttemptError.Unauthorized => Unauthorized(),
            QuizAttemptError.Forbidden => Forbid(),
            QuizAttemptError.NotFound => string.IsNullOrWhiteSpace(message) ? NotFound() : NotFound(message),
            QuizAttemptError.DemoQuestionLimitReached => BadRequest(message ?? "Demo günlük soru limitiniz doldu."),
            _ => BadRequest(message ?? "Quiz işlemi tamamlanamadı.")
        };
}
