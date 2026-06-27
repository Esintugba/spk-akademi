using API.Data;
using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Student)]
[Route("api/topic-preferences")]
public class TopicPreferencesController(
    DataContext context,
    UserManager<AppUser> userManager,
    ILicenseAccessService accessService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TopicPreferenceDto>>> GetAll(CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var preferences = await context.UserTopicPreferences
            .AsNoTracking()
            .Where(x => x.UserId == userId && (x.IsFavorite || x.IsInWeeklyPlan))
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Select(x => new TopicPreferenceDto(
                x.TopicId,
                x.IsFavorite,
                x.IsInWeeklyPlan,
                x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(preferences);
    }

    [HttpPatch("{topicId:guid}")]
    public async Task<ActionResult<TopicPreferenceDto>> Update(
        Guid topicId,
        UpdateTopicPreferenceDto dto,
        CancellationToken cancellationToken)
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

        var preference = await context.UserTopicPreferences
            .FirstOrDefaultAsync(x => x.UserId == userId && x.TopicId == topicId, cancellationToken);

        if (preference is null)
        {
            preference = new UserTopicPreference
            {
                UserId = userId,
                TopicId = topicId
            };
            context.UserTopicPreferences.Add(preference);
        }

        preference.IsFavorite = dto.IsFavorite ?? preference.IsFavorite;
        preference.IsInWeeklyPlan = dto.IsInWeeklyPlan ?? preference.IsInWeeklyPlan;
        preference.UpdatedAt = DateTime.UtcNow;

        if (!preference.IsFavorite && !preference.IsInWeeklyPlan)
        {
            context.UserTopicPreferences.Remove(preference);
        }

        await context.SaveChangesAsync(cancellationToken);

        return Ok(new TopicPreferenceDto(
            topicId,
            preference.IsFavorite,
            preference.IsInWeeklyPlan,
            preference.UpdatedAt));
    }
}
