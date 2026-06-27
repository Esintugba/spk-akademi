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
[Route("api/quizzes/course-practice")]
public class CoursePracticeController(
    UserManager<AppUser> userManager,
    ICoursePracticeService coursePracticeService) : ControllerBase
{
    [HttpGet("courses")]
    public async Task<ActionResult<IReadOnlyList<CoursePracticeCourseOptionDto>>> GetCourses(
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await coursePracticeService.GetCourseOptionsAsync(userId, cancellationToken));
    }

    [HttpPost("start")]
    public async Task<ActionResult<CoursePracticeQuizResponseDto>> StartPractice(
        StartCoursePracticeQuizRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var outcome = await coursePracticeService.StartPracticeAsync(userId, dto, cancellationToken);

        return outcome.Error switch
        {
            CoursePracticeStartError.CourseNotFound => NotFound("Ders bulunamadı."),
            CoursePracticeStartError.Forbidden => Forbid(),
            CoursePracticeStartError.InvalidTopics => BadRequest("Seçilen konular bu derse ait değil."),
            CoursePracticeStartError.DemoQuestionLimitReached => BadRequest("Demo günlük soru limitiniz doldu. Tam erişim için erişim talebi oluşturabilirsiniz."),
            CoursePracticeStartError.NotEnoughQuestions => BadRequest(new
            {
                message = $"Bu filtrelerle en az 5 soru gerekir. Uygun soru sayisi: {outcome.AvailableQuestionCount}.",
                availableQuestionCount = outcome.AvailableQuestionCount,
                requiredMinimum = 5
            }),
            _ => Ok(outcome.Response)
        };
    }
}
