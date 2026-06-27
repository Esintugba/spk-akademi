using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/courses")]
public class CoursesController(
    UserManager<AppUser> userManager,
    ICourseManagementService courseManagementService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CourseDto>>> GetCourses(
        [FromQuery] Guid? licenseId,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await courseManagementService.GetCoursesAsync(userId, licenseId, cancellationToken);

        if (outcome.Error == CourseManagementError.None && outcome.Result is not null)
        {
            return Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseDto>> GetCourse(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        var outcome = await courseManagementService.GetCourseAsync(userId, id, cancellationToken);

        return ToCourseActionResult(outcome);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<CourseDto>> CreateCourse(
        CreateCourseDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await courseManagementService.CreateCourseAsync(dto, cancellationToken);
        return ToCourseActionResult(outcome, created: true);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> UpdateCourse(
        Guid id,
        UpdateCourseDto dto,
        CancellationToken cancellationToken = default)
    {
        var outcome = await courseManagementService.UpdateCourseAsync(id, dto, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> DeleteCourse(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var outcome = await courseManagementService.DeleteCourseAsync(id, cancellationToken);
        return ToEmptyActionResult(outcome);
    }

    private ActionResult<CourseDto> ToCourseActionResult(
        CourseManagementOutcome<CourseDto> outcome,
        bool created = false)
    {
        if (outcome.Error == CourseManagementError.None && outcome.Result is not null)
        {
            return created
                ? CreatedAtAction(nameof(GetCourse), new { id = outcome.Result.Id }, outcome.Result)
                : Ok(outcome.Result);
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private IActionResult ToEmptyActionResult(CourseManagementOutcome<bool> outcome)
    {
        if (outcome.Error == CourseManagementError.None)
        {
            return NoContent();
        }

        return ToErrorActionResult(outcome.Error, outcome.Message);
    }

    private ActionResult ToErrorActionResult(CourseManagementError error, string? message) =>
        error switch
        {
            CourseManagementError.Unauthorized => Unauthorized(),
            CourseManagementError.Forbidden => Forbid(),
            CourseManagementError.NotFound => NotFound(),
            _ => BadRequest(message ?? "Ders işlemi tamamlanamadı.")
        };
}
