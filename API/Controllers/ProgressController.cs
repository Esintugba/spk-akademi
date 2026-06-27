using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/progress")]
public class ProgressController(
    UserManager<AppUser> userManager,
    IProgressService progressService,
    ILicenseAccessService accessService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<ActionResult<ProgressOverviewDto>> GetOverview()
    {
        var userId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await progressService.GetOverview(userId));
    }

    [HttpGet("licenses")]
    public async Task<ActionResult<IReadOnlyList<LicenseProgressDto>>> GetLicenses()
    {
        var userId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await progressService.GetLicenseProgresses(userId));
    }

    [HttpGet("courses")]
    public async Task<ActionResult<IReadOnlyList<CourseProgressDto>>> GetCourses()
    {
        var userId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await progressService.GetCourseProgresses(userId));
    }

    [HttpGet("course/{id:guid}")]
    public async Task<ActionResult<CourseProgressDto>> GetCourse(Guid id)
    {
        var userId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!await accessService.CanAccessCourse(userId, id))
        {
            return Forbid();
        }

        var courseProgress = await progressService.GetCourseProgress(userId, id);

        return courseProgress is null ? NotFound() : Ok(courseProgress);
    }

    [HttpGet("statistics")]
    public async Task<ActionResult<ProgressStatisticsDto>> GetStatistics()
    {
        var userId = userManager.GetUserId(User);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await progressService.GetStatistics(userId));
    }
}
