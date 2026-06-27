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
[Route("api/quizzes/past-exams")]
public class PastExamQuizzesController(
    UserManager<AppUser> userManager,
    IPastExamQuizService pastExamQuizService) : ControllerBase
{
    [HttpPost("start")]
    public async Task<ActionResult<PastExamQuizStartResponseDto>> Start(
        StartPastExamQuizRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var outcome = await pastExamQuizService.StartAsync(userId, dto, cancellationToken);
        return outcome.Error switch
        {
            PastExamQuizStartError.Forbidden => Forbid(),
            PastExamQuizStartError.InvalidTopics => BadRequest("Seçilen konular geçersiz."),
            PastExamQuizStartError.DemoQuestionLimitReached => BadRequest("Demo günlük soru limitiniz doldu. Tam erişim için erişim talebi oluşturabilirsiniz."),
            PastExamQuizStartError.NotEnoughQuestions => BadRequest(new
            {
                message = $"Bu filtrelerle en az 5 soru gerekir. Uygun soru sayısı: {outcome.AvailableQuestionCount}.",
                availableQuestionCount = outcome.AvailableQuestionCount,
                requiredMinimum = 5
            }),
            _ => Ok(outcome.Response)
        };
    }
}

