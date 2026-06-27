using API.Entities;

namespace API.Dtos;

public record UserSettingsDto(
    string UserId,
    UserThemePreference Theme,
    UserLanguagePreference Language,
    UserDateFormatPreference DateFormat,
    UserTimeFormatPreference TimeFormat,
    bool CompactView,
    bool EmailNotifications,
    bool PushNotifications,
    bool NewContentNotifications,
    bool TrialReminders,
    bool ReviewReminder,
    bool DailyGoalReminder,
    bool WeeklyGoalReminder,
    bool StudyReminders,
    bool SupportTicketUpdates,
    int DailyGoalQuestionCount,
    int DailyStudyMinutes,
    DateTime? ExamDate,
    int WeeklyStudyMinutes,
    string PreferredStudyDays,
    UserDefaultQuizMode DefaultQuizMode,
    int DefaultQuestionCount,
    bool AutoReviewSuggestions,
    bool TimedQuizDefault,
    int DefaultQuizDurationMinutes,
    bool AutoOpenExplanations,
    UserQuestionTransitionPreference QuestionTransition,
    bool AutoAddWrongAnswersToReview,
    UserPdfViewPreference PreferredPdfView,
    bool RememberLastPdfPage,
    bool AutoSaveNotes,
    bool ShowHighlights,
    bool SecurityNotifications,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public class UpdateUserSettingsDto
{
    public UserThemePreference Theme { get; set; } = UserThemePreference.System;

    public UserLanguagePreference Language { get; set; } = UserLanguagePreference.Turkish;

    public UserDateFormatPreference DateFormat { get; set; } = UserDateFormatPreference.DayMonthYear;

    public UserTimeFormatPreference TimeFormat { get; set; } = UserTimeFormatPreference.TwentyFourHour;

    public bool CompactView { get; set; }

    public bool EmailNotifications { get; set; } = true;

    public bool PushNotifications { get; set; } = true;

    public bool NewContentNotifications { get; set; } = true;

    public bool TrialReminders { get; set; } = true;

    public bool ReviewReminder { get; set; } = true;

    public bool DailyGoalReminder { get; set; } = true;

    public bool WeeklyGoalReminder { get; set; } = true;

    public bool StudyReminders { get; set; } = true;

    public bool SupportTicketUpdates { get; set; } = true;

    public int DailyGoalQuestionCount { get; set; } = 25;

    public int DailyStudyMinutes { get; set; } = 45;

    public DateTime? ExamDate { get; set; }

    public int WeeklyStudyMinutes { get; set; } = 315;

    public string PreferredStudyDays { get; set; } = "1,2,3,4,5,6,0";

    public UserDefaultQuizMode DefaultQuizMode { get; set; } = UserDefaultQuizMode.Mixed;

    public int DefaultQuestionCount { get; set; } = 20;

    public bool AutoReviewSuggestions { get; set; } = true;

    public bool TimedQuizDefault { get; set; }

    public int DefaultQuizDurationMinutes { get; set; } = 30;

    public bool AutoOpenExplanations { get; set; } = true;

    public UserQuestionTransitionPreference QuestionTransition { get; set; } = UserQuestionTransitionPreference.Manual;

    public bool AutoAddWrongAnswersToReview { get; set; } = true;

    public UserPdfViewPreference PreferredPdfView { get; set; } = UserPdfViewPreference.Pdf;

    public bool RememberLastPdfPage { get; set; } = true;

    public bool AutoSaveNotes { get; set; } = true;

    public bool ShowHighlights { get; set; } = true;

    public bool SecurityNotifications { get; set; } = true;
}

public record UserSecuritySettingsDto(
    string Email,
    string DisplayName,
    bool EmailConfirmed,
    bool TwoFactorReady,
    int ActiveSessionCount,
    DateTime? RefreshTokenExpiresAt,
    DateTime CreatedAt,
    bool SecurityNotifications);
