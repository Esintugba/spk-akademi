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
[Route("api/quizzes/wrong-answers")]
public class WrongAnswersController(
    UserManager<AppUser> userManager,
    IWrongAnswerService wrongAnswerService) : ControllerBase
{
    [HttpPost("start")]
    public async Task<ActionResult<WrongAnswersQuizStartResponseDto>> StartQuiz(
        StartWrongAnswersQuizRequestDto dto,
        CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        var outcome = await wrongAnswerService.StartQuizAsync(studentId, dto, cancellationToken);

        return outcome.Error switch
        {
            WrongAnswerStartError.DemoQuestionLimitReached => BadRequest("Demo günlük soru limitiniz doldu. Tam erişim için erişim talebi oluşturabilirsiniz."),
            WrongAnswerStartError.NotEnoughQuestions => BadRequest(new
            {
                message = $"Tekrar için en az 5 soru gerekir. Şu an uygun soru sayısı: {outcome.AvailableDueCount}.",
                availableDueCount = outcome.AvailableDueCount,
                requiredMinimum = 5
            }),
            WrongAnswerStartError.NoAccessibleQuestions => BadRequest("Erişilebilir tekrar sorusu bulunamadı."),
            _ => Ok(outcome.Response)
        };
    }

    [HttpGet("queue")]
    public async Task<ActionResult<WrongAnswerQueuePageDto>> GetQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool dueOnly = false,
        [FromQuery] Guid? courseId = null,
        [FromQuery] Guid? topicId = null,
        [FromQuery] QuestionDifficulty? difficulty = null,
        CancellationToken cancellationToken = default)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        return Ok(await wrongAnswerService.GetQueueAsync(
            studentId,
            page,
            pageSize,
            dueOnly,
            courseId,
            topicId,
            difficulty,
            cancellationToken));
    }

    [HttpDelete("{questionId:guid}")]
    public async Task<ActionResult<RemoveFromQueueResultDto>> RemoveFromQueue(
        Guid questionId,
        CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        var removed = await wrongAnswerService.RemoveFromQueueAsync(studentId, questionId, cancellationToken);
        return removed
            ? Ok(new RemoveFromQueueResultDto(questionId, true))
            : NotFound(new RemoveFromQueueResultDto(questionId, false));
    }

    [HttpGet("stats")]
    public async Task<ActionResult<WrongAnswerStatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var studentId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(studentId))
        {
            return Unauthorized();
        }

        return Ok(await wrongAnswerService.GetStatsAsync(studentId, cancellationToken));
    }
}
