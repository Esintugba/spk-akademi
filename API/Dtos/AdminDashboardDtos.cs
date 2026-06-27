namespace API.Dtos;

public record AdminDashboardDto(
    AdminDashboardStatsDto Stats,
    PendingActionsDto PendingActions,
    IReadOnlyList<ExpiringAccessDto> ExpiringAccesses,
    IReadOnlyList<RecentUserDto> RecentUsers,
    IReadOnlyList<RecentMessageDto> RecentMessages,
    ModerationQueueDto ModerationQueue,
    ContentOperationDto ContentStats,
    UserActivityDto UserActivity,
    IReadOnlyList<LicenseStudentCountDto> LicenseAccess,
    SystemHealthDto SystemHealth,
    AdminSupportDashboardDto SupportTickets,
    IReadOnlyList<CriticalAlertDto> CriticalAlerts);

public record AdminDashboardStatsDto(
    int TotalUsers,
    int ActiveStudents,
    int ActiveLicenses,
    int TotalQuestions,
    int TotalTrialExams,
    int TodayActiveUsers,
    int ThisWeekNewUsers);

public record PendingActionsDto(
    int PendingAccessRequests,
    int PendingContentReviews,
    int ExpiredAccessesToday,
    int FailedImports,
    int UnreadMessages);

public record RecentUserDto(
    string Id,
    string DisplayName,
    string Email,
    DateTime CreatedAt);

public record ExpiringAccessDto(
    Guid Id,
    string UserId,
    string UserEmail,
    string LicenseName,
    DateTime ExpiresAt,
    bool IsExpired);

public record RecentMessageDto(
    Guid Id,
    string Subject,
    string SenderName,
    string SenderEmail,
    DateTime CreatedAt);

public record ModerationQueueDto(
    int PendingQuestions,
    int PendingStudyNotes,
    int PendingMaterials,
    int PendingTrialExams,
    int DraftBlogPosts,
    int MissingSeoMetadata);

public record ContentOperationDto(
    int QuestionsAddedThisWeek,
    int TrialExamsAddedThisWeek,
    int MaterialsAddedThisWeek,
    int ApprovedQuestions,
    int PublishedTrialExams);

public record UserActivityDto(
    int TodayLoggedInUsers,
    int ActiveUsersToday,
    int QuestionsSolvedToday,
    int TrialsCompletedToday);

public record LicenseStudentCountDto(
    Guid LicenseId,
    string LicenseName,
    int ActiveStudentCount);

public record SystemHealthDto(
    string ApiStatus,
    int BackgroundJobsQueued,
    int MailQueuePending,
    int ImportQueuePending,
    IReadOnlyList<BackgroundQueueStatusDto> Queues,
    DateTime CheckedAt);

public record BackgroundQueueStatusDto(
    string Name,
    int Capacity,
    int PendingCount,
    long EnqueuedCount,
    long ProcessedCount,
    long FailedCount,
    double UsagePercent,
    double AverageProcessingMilliseconds,
    DateTime? OldestPendingAt);

public record CriticalAlertDto(
    string Severity,
    string Title,
    string Description,
    string TargetPath);
