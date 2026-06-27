using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IAdminDashboardService
{
    Task<AdminDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);
}

public class AdminDashboardService(
    DataContext context,
    BackgroundQueueMetrics queueMetrics) : IAdminDashboardService
{
    public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var tomorrow = today.AddDays(1);
        var weekStart = today.AddDays(-6);
        var nextWeek = now.AddDays(7);

        var totalUsers = await context.Users.CountAsync(cancellationToken);
        var activeStudentIds = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.IsActive && (x.ExpiresAt == null || x.ExpiresAt > now) && (x.EndDate == null || x.EndDate > now))
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var todayQuizUsers = await context.QuizAttempts
            .AsNoTracking()
            .Where(x => x.UserId != null && (x.StartedAt >= today || x.LastActivityAt >= today || x.FinishedAt >= today))
            .Select(x => x.UserId!)
            .Distinct()
            .ToListAsync(cancellationToken);

        var todayStudyUsers = await context.StudyProgresses
            .AsNoTracking()
            .Where(x => x.UserId != null && x.LastStudiedAt >= today)
            .Select(x => x.UserId!)
            .Distinct()
            .ToListAsync(cancellationToken);

        var todayActiveUsers = todayQuizUsers.Concat(todayStudyUsers).Distinct().Count();
        var pendingQuestions = await CountPendingAsync(context.Questions, cancellationToken);
        var pendingStudyNotes = await CountPendingAsync(context.StudyNotes, cancellationToken);
        var pendingMaterials = await CountPendingAsync(context.SourceDocuments, cancellationToken);
        var pendingTrialExams = await CountPendingAsync(context.TrialExams, cancellationToken);
        var draftBlogPosts = await context.BlogPosts
            .AsNoTracking()
            .CountAsync(x => !x.IsDeleted && x.Status == BlogPostStatus.Draft, cancellationToken);
        var missingSeoMetadata = await context.BlogPosts
            .AsNoTracking()
            .CountAsync(x => !x.IsDeleted && (string.IsNullOrWhiteSpace(x.MetaTitle) || string.IsNullOrWhiteSpace(x.MetaDescription)), cancellationToken);

        var expiredAccessesToday = await context.UserLicenseAccesses
            .AsNoTracking()
            .CountAsync(x => x.IsActive && ((x.ExpiresAt >= today && x.ExpiresAt < tomorrow) || (x.EndDate >= today && x.EndDate < tomorrow)), cancellationToken);
        var failedImports = await context.ImportJobs
            .AsNoTracking()
            .CountAsync(x => x.Status == ImportJobStatus.Failed || x.Status == ImportJobStatus.PartiallyCompleted, cancellationToken);
        var unreadMessages = await context.ContactMessages
            .AsNoTracking()
            .CountAsync(x => x.ReadAt == null && x.Status == ContactMessageStatus.Pending, cancellationToken);

        var expiringAccesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.License)
            .Where(x => x.IsActive && (
                (x.ExpiresAt != null && x.ExpiresAt <= nextWeek) ||
                (x.ExpiresAt == null && x.EndDate != null && x.EndDate <= nextWeek)))
            .OrderBy(x => x.ExpiresAt ?? x.EndDate)
            .Take(10)
            .Select(x => new ExpiringAccessDto(
                x.Id,
                x.UserId,
                x.User != null ? x.User.Email ?? string.Empty : string.Empty,
                x.License != null ? x.License.Name : "Lisans",
                (x.ExpiresAt ?? x.EndDate)!.Value,
                (x.ExpiresAt ?? x.EndDate)!.Value < now))
            .ToListAsync(cancellationToken);

        var recentUsers = await context.Users
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .Select(x => new RecentUserDto(
                x.Id,
                x.DisplayName,
                x.Email ?? string.Empty,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        var recentMessages = await context.ContactMessages
            .AsNoTracking()
            .Where(x => x.Status == ContactMessageStatus.Pending || x.ReadAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .Take(8)
            .Select(x => new RecentMessageDto(
                x.Id,
                x.Subject,
                x.Name,
                x.Email,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        var licenseAccess = await context.Licenses
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new LicenseStudentCountDto(
                x.Id,
                x.Name,
                context.UserLicenseAccesses.Count(access =>
                    access.LicenseId == x.Id &&
                    access.IsActive &&
                    (access.ExpiresAt == null || access.ExpiresAt > now) &&
                    (access.EndDate == null || access.EndDate > now))))
            .ToListAsync(cancellationToken);

        var queueSnapshots = queueMetrics.GetSnapshots();
        var queueStatuses = queueSnapshots
            .Select(snapshot => new BackgroundQueueStatusDto(
                snapshot.Name,
                snapshot.Capacity,
                snapshot.PendingCount,
                snapshot.EnqueuedCount,
                snapshot.ProcessedCount,
                snapshot.FailedCount,
                Math.Round(snapshot.UsageRatio * 100, 1),
                Math.Round(snapshot.AverageProcessingMilliseconds, 1),
                snapshot.OldestPendingAt))
            .ToList();
        var contactQueuePending = queueSnapshots.FirstOrDefault(x => x.Name == BackgroundQueueNames.Contact)?.PendingCount ?? 0;
        var importQueuePending = queueSnapshots.FirstOrDefault(x => x.Name == BackgroundQueueNames.Import)?.PendingCount ?? 0;
        var totalQueuePending = queueSnapshots.Sum(x => x.PendingCount);
        var supportTickets = await BuildSupportTicketDashboardAsync(today, tomorrow, cancellationToken);
        var criticalAlerts = await BuildCriticalAlertsAsync(cancellationToken);

        return new AdminDashboardDto(
            new AdminDashboardStatsDto(
                totalUsers,
                activeStudentIds.Count,
                await context.Licenses.CountAsync(x => x.IsActive, cancellationToken),
                await context.Questions.CountAsync(x => !x.IsDeleted, cancellationToken),
                await context.TrialExams.CountAsync(x => !x.IsDeleted, cancellationToken),
                todayActiveUsers,
                await context.Users.CountAsync(x => x.CreatedAt >= weekStart, cancellationToken)),
            new PendingActionsDto(
                await context.AccessRequests.CountAsync(x => x.Status == AccessRequestStatus.Pending || x.Status == AccessRequestStatus.Waitlisted, cancellationToken),
                pendingQuestions + pendingStudyNotes + pendingMaterials + pendingTrialExams,
                expiredAccessesToday,
                failedImports,
                unreadMessages),
            expiringAccesses,
            recentUsers,
            recentMessages,
            new ModerationQueueDto(
                pendingQuestions,
                pendingStudyNotes,
                pendingMaterials,
                pendingTrialExams,
                draftBlogPosts,
                missingSeoMetadata),
            new ContentOperationDto(
                await context.Questions.CountAsync(x => x.CreatedAt >= weekStart && !x.IsDeleted, cancellationToken),
                await context.TrialExams.CountAsync(x => x.CreatedAt >= weekStart && !x.IsDeleted, cancellationToken),
                await context.SourceDocuments.CountAsync(x => x.CreatedAt >= weekStart && !x.IsDeleted, cancellationToken),
                await context.Questions.CountAsync(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.Approved, cancellationToken),
                await context.TrialExams.CountAsync(x => !x.IsDeleted && x.IsPublished && x.ReviewStatus == ReviewStatus.Approved, cancellationToken)),
            new UserActivityDto(
                todayActiveUsers,
                todayActiveUsers,
                await context.QuizAnswers.CountAsync(x => x.AnsweredAt >= today, cancellationToken),
                await context.QuizAttempts.CountAsync(x => x.Mode == QuizMode.TrialExam && x.FinishedAt >= today, cancellationToken)),
            licenseAccess,
            new SystemHealthDto(
                "Healthy",
                totalQueuePending,
                contactQueuePending,
                importQueuePending,
                queueStatuses,
                now),
            supportTickets,
            criticalAlerts);
    }

    private static Task<int> CountPendingAsync<T>(IQueryable<T> query, CancellationToken cancellationToken)
        where T : ModeratedEntity =>
        query.AsNoTracking().CountAsync(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.PendingReview, cancellationToken);

    private async Task<IReadOnlyList<CriticalAlertDto>> BuildCriticalAlertsAsync(CancellationToken cancellationToken)
    {
        var alerts = new List<CriticalAlertDto>();

        var emptyLicenses = await context.Licenses
            .AsNoTracking()
            .CountAsync(x => x.IsActive && !x.Courses.Any(), cancellationToken);
        if (emptyLicenses > 0)
        {
            alerts.Add(new CriticalAlertDto("warning", "İçeriği olmayan lisanslar", $"{emptyLicenses} aktif lisansın bağlı dersi yok.", "/admin/licenses"));
        }

        var topicsWithoutQuestions = await context.Topics
            .AsNoTracking()
            .CountAsync(x => !x.Questions.Any(question => !question.IsDeleted && question.ReviewStatus == ReviewStatus.Approved), cancellationToken);
        if (topicsWithoutQuestions > 0)
        {
            alerts.Add(new CriticalAlertDto("warning", "Sorusu olmayan konular", $"{topicsWithoutQuestions} konu onaylı soru içermiyor.", "/admin/topics"));
        }

        var brokenPdfPaths = await context.SourceDocuments
            .AsNoTracking()
            .CountAsync(x => !x.IsDeleted && string.IsNullOrWhiteSpace(x.FilePath), cancellationToken);
        if (brokenPdfPaths > 0)
        {
            alerts.Add(new CriticalAlertDto("error", "Kırık PDF kayıtları", $"{brokenPdfPaths} materyalin dosya yolu eksik.", "/admin/sources"));
        }

        var missingSeo = await context.BlogPosts
            .AsNoTracking()
            .CountAsync(x => !x.IsDeleted && (string.IsNullOrWhiteSpace(x.MetaTitle) || string.IsNullOrWhiteSpace(x.MetaDescription)), cancellationToken);
        if (missingSeo > 0)
        {
            alerts.Add(new CriticalAlertDto("warning", "Eksik SEO metadata", $"{missingSeo} blog yazısında meta başlık veya açıklama eksik.", "/admin/blog"));
        }

        var expiredAccesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .CountAsync(x => x.IsActive && ((x.ExpiresAt != null && x.ExpiresAt < DateTime.UtcNow) || (x.EndDate != null && x.EndDate < DateTime.UtcNow)), cancellationToken);
        if (expiredAccesses > 0)
        {
            alerts.Add(new CriticalAlertDto("error", "Süresi dolmuş erişimler", $"{expiredAccesses} erişim süresi dolduğu halde aktif görünüyor.", "/admin/access"));
        }

        return alerts;
    }

    private async Task<AdminSupportDashboardDto> BuildSupportTicketDashboardAsync(
        DateTime today,
        DateTime tomorrow,
        CancellationToken cancellationToken)
    {
        var pending = await context.SupportTickets
            .AsNoTracking()
            .CountAsync(x =>
                x.Status == SupportTicketStatus.Open ||
                x.Status == SupportTicketStatus.InProgress ||
                x.Status == SupportTicketStatus.WaitingForUser,
                cancellationToken);
        var unassigned = await context.SupportTickets
            .AsNoTracking()
            .CountAsync(x => x.AssignedAdminId == null || x.AssignedAdminId == string.Empty, cancellationToken);
        var openedToday = await context.SupportTickets
            .AsNoTracking()
            .CountAsync(x => x.CreatedAt >= today && x.CreatedAt < tomorrow, cancellationToken);
        var critical = await context.SupportTickets
            .AsNoTracking()
            .CountAsync(x =>
                x.Priority == SupportTicketPriority.Critical &&
                x.Status != SupportTicketStatus.Resolved &&
                x.Status != SupportTicketStatus.Closed,
                cancellationToken);

        return new AdminSupportDashboardDto(pending, unassigned, openedToday, critical);
    }
}
