using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum UserSettingsError
{
    None,
    Unauthorized
}

public interface IUserSettingsService
{
    Task<UserSettingsDto> GetAsync(string userId, CancellationToken cancellationToken = default);

    Task<UserSettingsDto> UpdateAsync(string userId, UpdateUserSettingsDto dto, CancellationToken cancellationToken = default);

    Task<UserSecuritySettingsDto?> GetSecurityAsync(string userId, CancellationToken cancellationToken = default);
}

public class UserSettingsService(
    DataContext context,
    UserManager<AppUser> userManager) : IUserSettingsService
{
    public async Task<UserSettingsDto> GetAsync(string userId, CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateAsync(userId, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(settings);
    }

    public async Task<UserSettingsDto> UpdateAsync(
        string userId,
        UpdateUserSettingsDto dto,
        CancellationToken cancellationToken = default)
    {
        var settings = await GetOrCreateAsync(userId, cancellationToken);
        Apply(settings, dto);
        settings.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        return ToDto(settings);
    }

    public async Task<UserSecuritySettingsDto?> GetSecurityAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var settings = await GetOrCreateAsync(userId, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return new UserSecuritySettingsDto(
            user.Email ?? string.Empty,
            user.DisplayName,
            user.EmailConfirmed,
            false,
            string.IsNullOrWhiteSpace(user.RefreshToken) ? 0 : 1,
            user.RefreshTokenExpiresAt,
            user.CreatedAt,
            settings.SecurityNotifications);
    }

    private async Task<UserSettings> GetOrCreateAsync(string userId, CancellationToken cancellationToken)
    {
        var settings = await context.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (settings is not null)
        {
            return settings;
        }

        settings = new UserSettings
        {
            UserId = userId
        };
        context.UserSettings.Add(settings);
        return settings;
    }

    private static void Apply(UserSettings settings, UpdateUserSettingsDto dto)
    {
        settings.Theme = dto.Theme;
        settings.Language = dto.Language;
        settings.DateFormat = dto.DateFormat;
        settings.TimeFormat = dto.TimeFormat;
        settings.CompactView = dto.CompactView;
        settings.EmailNotifications = dto.EmailNotifications;
        settings.PushNotifications = dto.PushNotifications;
        settings.NewContentNotifications = dto.NewContentNotifications;
        settings.TrialReminders = dto.TrialReminders;
        settings.ReviewReminder = dto.ReviewReminder;
        settings.DailyGoalReminder = dto.DailyGoalReminder;
        settings.WeeklyGoalReminder = dto.WeeklyGoalReminder;
        settings.StudyReminders = dto.StudyReminders;
        settings.SupportTicketUpdates = dto.SupportTicketUpdates;
        settings.DailyGoalQuestionCount = Math.Clamp(dto.DailyGoalQuestionCount, 1, 500);
        settings.DailyStudyMinutes = Math.Clamp(dto.DailyStudyMinutes, 5, 720);
        settings.ExamDate = dto.ExamDate?.ToUniversalTime();
        settings.WeeklyStudyMinutes = Math.Clamp(dto.WeeklyStudyMinutes, 30, 5040);
        settings.PreferredStudyDays = string.IsNullOrWhiteSpace(dto.PreferredStudyDays)
            ? "1,2,3,4,5,6,0"
            : dto.PreferredStudyDays.Trim();
        settings.DefaultQuizMode = dto.DefaultQuizMode;
        settings.DefaultQuestionCount = Math.Clamp(dto.DefaultQuestionCount, 5, 200);
        settings.AutoReviewSuggestions = dto.AutoReviewSuggestions;
        settings.TimedQuizDefault = dto.TimedQuizDefault;
        settings.DefaultQuizDurationMinutes = Math.Clamp(dto.DefaultQuizDurationMinutes, 5, 240);
        settings.AutoOpenExplanations = dto.AutoOpenExplanations;
        settings.QuestionTransition = dto.QuestionTransition;
        settings.AutoAddWrongAnswersToReview = dto.AutoAddWrongAnswersToReview;
        settings.PreferredPdfView = dto.PreferredPdfView;
        settings.RememberLastPdfPage = dto.RememberLastPdfPage;
        settings.AutoSaveNotes = dto.AutoSaveNotes;
        settings.ShowHighlights = dto.ShowHighlights;
        settings.SecurityNotifications = dto.SecurityNotifications;
    }

    private static UserSettingsDto ToDto(UserSettings settings) =>
        new(
            settings.UserId,
            settings.Theme,
            settings.Language,
            settings.DateFormat,
            settings.TimeFormat,
            settings.CompactView,
            settings.EmailNotifications,
            settings.PushNotifications,
            settings.NewContentNotifications,
            settings.TrialReminders,
            settings.ReviewReminder,
            settings.DailyGoalReminder,
            settings.WeeklyGoalReminder,
            settings.StudyReminders,
            settings.SupportTicketUpdates,
            settings.DailyGoalQuestionCount,
            settings.DailyStudyMinutes,
            settings.ExamDate,
            settings.WeeklyStudyMinutes,
            settings.PreferredStudyDays,
            settings.DefaultQuizMode,
            settings.DefaultQuestionCount,
            settings.AutoReviewSuggestions,
            settings.TimedQuizDefault,
            settings.DefaultQuizDurationMinutes,
            settings.AutoOpenExplanations,
            settings.QuestionTransition,
            settings.AutoAddWrongAnswersToReview,
            settings.PreferredPdfView,
            settings.RememberLastPdfPage,
            settings.AutoSaveNotes,
            settings.ShowHighlights,
            settings.SecurityNotifications,
            settings.CreatedAt,
            settings.UpdatedAt);
}
