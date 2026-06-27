using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IProgressService
{
    Task<ProgressOverviewDto> GetOverview(string userId);

    Task<IReadOnlyList<LicenseProgressDto>> GetLicenseProgresses(string userId);

    Task<IReadOnlyList<CourseProgressDto>> GetCourseProgresses(string userId);

    Task<CourseProgressDto?> GetCourseProgress(string userId, Guid courseId);

    Task<ProgressStatisticsDto> GetStatistics(string userId);
}

public class ProgressService(
    DataContext context,
    ILicenseAccessService accessService) : IProgressService
{
    public async Task<ProgressOverviewDto> GetOverview(string userId)
    {
        var topicCatalog = await GetAccessibleTopicCatalog(userId);
        var progressMap = await GetProgressMap(userId, topicCatalog.Select(x => x.TopicId).ToList());
        var attempts = await GetFinishedAttempts(userId);
        var courseProgresses = BuildCourseProgressRows(topicCatalog, progressMap);
        var progressRows = BuildTopicProgressRows(topicCatalog, progressMap);
        var today = DateTime.UtcNow.Date;
        var todayQuestionCount = attempts
            .Where(x => x.FinishedAt.Date == today)
            .Sum(x => x.TotalQuestions);
        var dailyGoalQuestionCount = await context.UserSettings
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (int?)x.DailyGoalQuestionCount)
            .FirstOrDefaultAsync() ?? 25;

        var totalQuestionCount = progressRows.Sum(x => x.CorrectCount + x.WrongCount);
        var correctCount = progressRows.Sum(x => x.CorrectCount);
        var wrongCount = progressRows.Sum(x => x.WrongCount);

        return new ProgressOverviewDto(
            topicCatalog.Select(x => x.LicenseId).Distinct().Count(),
            courseProgresses.Count,
            courseProgresses.Count(x => x.IsCompleted),
            topicCatalog.Count,
            progressRows.Count(x => IsStudiedStatus(x.Status)),
            progressRows.Count(x => x.Status == StudyStatus.NeedsReview),
            progressRows.Count(x => x.Status == StudyStatus.Mastered),
            attempts.Count,
            totalQuestionCount,
            correctCount,
            wrongCount,
            CalculateRate(correctCount, totalQuestionCount),
            progressRows.Max(x => x.LastStudiedAt),
            new ProgressDailyGoalDto(
                dailyGoalQuestionCount,
                todayQuestionCount,
                CalculateRate(todayQuestionCount, dailyGoalQuestionCount)),
            courseProgresses
                .Where(x => x.LastActivityAt.HasValue)
                .OrderByDescending(x => x.LastActivityAt)
                .Take(4)
                .Select(x => new ProgressRecentCourseDto(
                    x.CourseId,
                    x.LicenseId,
                    x.LicenseName,
                    x.CourseName,
                    x.StudiedTopicCount,
                    x.TotalTopicCount,
                    x.ProgressPercentage,
                    x.LastActivityAt))
                .ToList(),
            progressRows
                .Where(x => x.LastStudiedAt.HasValue)
                .OrderByDescending(x => x.LastStudiedAt)
                .Take(6)
                .Select(x => new ProgressRecentActivityDto(
                    x.TopicId,
                    x.CourseId,
                    x.LicenseId,
                    x.LicenseName,
                    x.CourseName,
                    x.TopicTitle,
                    x.Status,
                    x.CorrectCount,
                    x.WrongCount,
                    x.SuccessRate,
                    x.LastStudiedAt,
                    x.NextReviewAt))
                .ToList(),
            progressRows
                .Where(x => x.NextReviewAt.HasValue && x.NextReviewAt.Value >= today && x.Status == StudyStatus.NeedsReview)
                .OrderBy(x => x.NextReviewAt)
                .Take(5)
                .Select(x => new ProgressUpcomingReviewDto(
                    x.TopicId,
                    x.CourseId,
                    x.CourseName,
                    x.TopicTitle,
                    x.NextReviewAt,
                    x.Status))
                .ToList());
    }

    public async Task<IReadOnlyList<LicenseProgressDto>> GetLicenseProgresses(string userId)
    {
        var topicCatalog = await GetAccessibleTopicCatalog(userId);
        var progressMap = await GetProgressMap(userId, topicCatalog.Select(x => x.TopicId).ToList());

        var courseProgresses = BuildCourseProgressRows(topicCatalog, progressMap);
        var licenseRows = topicCatalog
            .GroupBy(x => new { x.LicenseId, x.LicenseName })
            .Select(group =>
            {
                var licenseTopicIds = group.Select(x => x.TopicId).ToHashSet();
                var licenseProgresses = progressMap.Values
                    .Where(x => licenseTopicIds.Contains(x.TopicId))
                    .ToList();
                var licenseCourses = courseProgresses
                    .Where(x => x.LicenseId == group.Key.LicenseId)
                    .ToList();
                var totalQuestionCount = licenseProgresses.Sum(x => x.CorrectCount + x.WrongCount);
                var correctCount = licenseProgresses.Sum(x => x.CorrectCount);
                var wrongCount = licenseProgresses.Sum(x => x.WrongCount);

                return new LicenseProgressDto(
                    group.Key.LicenseId,
                    group.Key.LicenseName,
                    licenseCourses.Count,
                    licenseCourses.Count(x => x.IsCompleted),
                    group.Count(),
                    licenseProgresses.Count(x => IsStudiedStatus(x.Status)),
                    licenseProgresses.Count(x => x.Status == StudyStatus.NeedsReview),
                    licenseProgresses.Count(x => x.Status == StudyStatus.Mastered),
                    totalQuestionCount,
                    correctCount,
                    wrongCount,
                    CalculateRate(correctCount, totalQuestionCount),
                    CalculateRate(licenseProgresses.Count(x => IsStudiedStatus(x.Status)), group.Count()),
                    licenseProgresses.Max(x => x.LastStudiedAt));
            })
            .OrderByDescending(x => x.ProgressPercentage)
            .ThenBy(x => x.LicenseName)
            .ToList();

        return licenseRows;
    }

    public async Task<IReadOnlyList<CourseProgressDto>> GetCourseProgresses(string userId)
    {
        var topicCatalog = await GetAccessibleTopicCatalog(userId);

        return await BuildCourseProgressDtos(userId, topicCatalog);
    }

    public async Task<CourseProgressDto?> GetCourseProgress(string userId, Guid courseId)
    {
        if (!await accessService.CanAccessCourse(userId, courseId))
        {
            return null;
        }

        var topicCatalog = await GetAccessibleTopicCatalog(userId, courseId);

        if (topicCatalog.Count == 0)
        {
            return null;
        }

        return (await BuildCourseProgressDtos(userId, topicCatalog)).FirstOrDefault();
    }

    private async Task<IReadOnlyList<CourseProgressDto>> BuildCourseProgressDtos(
        string userId,
        IReadOnlyList<TopicCatalogRow> topicCatalog)
    {
        if (topicCatalog.Count == 0)
        {
            return [];
        }

        var progressMap = await GetProgressMap(userId, topicCatalog.Select(x => x.TopicId).ToList());
        var progressRows = BuildTopicProgressRows(topicCatalog, progressMap);
        var topicIds = topicCatalog.Select(x => x.TopicId).ToList();
        var studyNoteCounts = await context.StudyNotes
            .AsNoTracking()
            .Where(x => topicIds.Contains(x.TopicId) && x.ReviewStatus == ReviewStatus.Approved)
            .GroupBy(x => x.TopicId)
            .Select(group => new { TopicId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.TopicId, x => x.Count);
        var courseIds = topicCatalog.Select(x => x.CourseId).Distinct().ToList();
        var sourceDocumentCounts = await context.SourceDocuments
            .AsNoTracking()
            .Where(x => courseIds.Contains(x.CourseId) && x.ReviewStatus == ReviewStatus.Approved)
            .GroupBy(x => x.CourseId)
            .Select(group => new { CourseId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.CourseId, x => x.Count);
        var now = DateTime.UtcNow;
        var wrongAnswerCounts = await context.WrongAnswerQueues
            .AsNoTracking()
            .Where(x =>
                x.StudentId == userId &&
                !x.IsMastered &&
                x.Question != null &&
                topicIds.Contains(x.Question.TopicId))
            .GroupBy(x => x.Question!.TopicId)
            .Select(group => new
            {
                TopicId = group.Key,
                QueueCount = group.Count(),
                DueCount = group.Count(x => x.NextReviewAt <= now)
            })
            .ToDictionaryAsync(x => x.TopicId);

        return progressRows
            .GroupBy(x => new { x.CourseId, x.CourseName, x.LicenseId, x.LicenseName })
            .OrderBy(group => topicCatalog.First(topic => topic.CourseId == group.Key.CourseId).CourseOrder)
            .ThenBy(group => group.Key.CourseName)
            .Select(group =>
            {
                var rows = group.ToList();
                var totalQuestionCount = rows.Sum(x => x.CorrectCount + x.WrongCount);
                var correctCount = rows.Sum(x => x.CorrectCount);
                var wrongCount = rows.Sum(x => x.WrongCount);
                var studiedTopicCount = rows.Count(x => IsStudiedStatus(x.Status));

                return new CourseProgressDto(
                    group.Key.CourseId,
                    group.Key.LicenseId,
                    group.Key.LicenseName,
                    group.Key.CourseName,
                    rows.Count,
                    studiedTopicCount,
                    rows.Count(x => x.Status is StudyStatus.Studied or StudyStatus.Mastered),
                    rows.Count(x => x.Status == StudyStatus.NeedsReview),
                    rows.Count(x => x.Status == StudyStatus.Mastered),
                    totalQuestionCount,
                    correctCount,
                    wrongCount,
                    CalculateRate(correctCount, totalQuestionCount),
                    CalculateRate(studiedTopicCount, rows.Count),
                    rows.Max(x => x.LastStudiedAt),
                    rows
                        .OrderBy(x => x.Order)
                        .Select(x => new CourseTopicProgressDto(
                            x.TopicId,
                            x.TopicTitle,
                            x.Order,
                            x.QuestionCount,
                            studyNoteCounts.GetValueOrDefault(x.TopicId),
                            sourceDocumentCounts.GetValueOrDefault(x.CourseId),
                            wrongAnswerCounts.GetValueOrDefault(x.TopicId)?.QueueCount ?? 0,
                            wrongAnswerCounts.GetValueOrDefault(x.TopicId)?.DueCount ?? 0,
                            x.Status,
                            x.CorrectCount,
                            x.WrongCount,
                            x.SuccessRate,
                            x.LastStudiedAt,
                            x.NextReviewAt))
                        .ToList());
            })
            .ToList();
    }

    public async Task<ProgressStatisticsDto> GetStatistics(string userId)
    {
        var attempts = await GetFinishedAttempts(userId);
        var today = DateTime.UtcNow.Date;
        var weekStart = StartOfWeek(today);
        var dailyTimeline = Enumerable.Range(0, 7)
            .Select(offset => today.AddDays(offset - 6))
            .Select(day =>
            {
                var dayAttempts = attempts.Where(x => x.FinishedAt.Date == day).ToList();
                var questionCount = dayAttempts.Sum(x => x.TotalQuestions);
                var correctCount = dayAttempts.Sum(x => x.CorrectCount);
                var wrongCount = dayAttempts.Sum(x => x.WrongCount);

                return new ProgressTimelinePointDto(
                    day.ToString("dd MMM"),
                    day,
                    dayAttempts.Count,
                    questionCount,
                    correctCount,
                    wrongCount,
                    CalculateRate(correctCount, questionCount));
            })
            .ToList();

        var weeklyTimeline = Enumerable.Range(0, 6)
            .Select(offset => weekStart.AddDays((offset - 5) * 7))
            .Select(start =>
            {
                var end = start.AddDays(7);
                var weekAttempts = attempts.Where(x => x.FinishedAt >= start && x.FinishedAt < end).ToList();
                var questionCount = weekAttempts.Sum(x => x.TotalQuestions);
                var correctCount = weekAttempts.Sum(x => x.CorrectCount);
                var wrongCount = weekAttempts.Sum(x => x.WrongCount);

                return new ProgressTimelinePointDto(
                    $"{start:dd MMM}",
                    start,
                    weekAttempts.Count,
                    questionCount,
                    correctCount,
                    wrongCount,
                    CalculateRate(correctCount, questionCount));
            })
            .ToList();

        var totalQuestionCount = attempts.Sum(x => x.TotalQuestions);
        var correctTotal = attempts.Sum(x => x.CorrectCount);
        var wrongTotal = attempts.Sum(x => x.WrongCount);

        return new ProgressStatisticsDto(
            attempts.Count,
            totalQuestionCount,
            correctTotal,
            wrongTotal,
            CalculateRate(correctTotal, totalQuestionCount),
            attempts.Count(x => x.FinishedAt.Date == today),
            attempts.Count(x => x.FinishedAt >= weekStart),
            attempts.Where(x => x.FinishedAt.Date == today).Sum(x => x.TotalQuestions),
            attempts.Where(x => x.FinishedAt >= weekStart).Sum(x => x.TotalQuestions),
            dailyTimeline,
            weeklyTimeline);
    }

    private async Task<List<TopicCatalogRow>> GetAccessibleTopicCatalog(string userId, Guid? courseId = null)
    {
        var accessibleLicenseIds = await accessService.GetAccessibleLicenseIds(userId);
        var query = context.Topics
            .AsNoTracking()
            .Where(x => accessibleLicenseIds.Contains(x.Course!.LicenseId));

        if (courseId.HasValue)
        {
            query = query.Where(x => x.CourseId == courseId.Value);
        }

        return await query
            .OrderBy(x => x.Course!.Order)
            .ThenBy(x => x.Order)
            .Select(x => new TopicCatalogRow(
                x.Id,
                x.Title,
                x.Order,
                x.Questions.Count(q => q.ReviewStatus == ReviewStatus.Approved),
                x.CourseId,
                x.Course!.Name,
                x.Course.Order,
                x.Course.LicenseId,
                x.Course.License!.Name))
            .ToListAsync();
    }

    private async Task<Dictionary<Guid, StudyProgress>> GetProgressMap(string userId, IReadOnlyList<Guid> topicIds)
    {
        var progresses = await context.StudyProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && topicIds.Contains(x.TopicId))
            .ToListAsync();

        return progresses.ToDictionary(x => x.TopicId);
    }

    private async Task<List<QuizAttemptRow>> GetFinishedAttempts(string userId)
    {
        return await context.QuizAttempts
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.FinishedAt.HasValue)
            .Select(x => new QuizAttemptRow(
                x.Id,
                x.FinishedAt!.Value,
                x.TotalQuestions,
                x.CorrectCount,
                x.WrongCount))
            .ToListAsync();
    }

    private static List<CourseProgressRow> BuildCourseProgressRows(
        IReadOnlyList<TopicCatalogRow> topicCatalog,
        IReadOnlyDictionary<Guid, StudyProgress> progressMap)
    {
        return topicCatalog
            .GroupBy(x => new { x.CourseId, x.CourseName, x.LicenseId, x.LicenseName })
            .Select(group =>
            {
                var rows = group
                    .Select(topic => progressMap.TryGetValue(topic.TopicId, out var progress)
                        ? progress
                        : new StudyProgress
                        {
                            TopicId = topic.TopicId,
                            Status = StudyStatus.NotStarted
                        })
                    .ToList();

                var studiedTopicCount = rows.Count(x => IsStudiedStatus(x.Status));

                return new CourseProgressRow(
                    group.Key.CourseId,
                    group.Key.CourseName,
                    group.Key.LicenseId,
                    group.Key.LicenseName,
                    group.Count(),
                    studiedTopicCount,
                    rows.All(x => x.Status is StudyStatus.Studied or StudyStatus.Mastered) && group.Any(),
                    CalculateRate(studiedTopicCount, group.Count()),
                    rows.Max(x => x.LastStudiedAt));
            })
            .OrderByDescending(x => x.LastActivityAt)
            .ThenBy(x => x.CourseName)
            .ToList();
    }

    private static List<TopicProgressRow> BuildTopicProgressRows(
        IReadOnlyList<TopicCatalogRow> topicCatalog,
        IReadOnlyDictionary<Guid, StudyProgress> progressMap)
    {
        return topicCatalog
            .Select(topic =>
            {
                progressMap.TryGetValue(topic.TopicId, out var progress);

                var status = progress?.Status ?? StudyStatus.NotStarted;
                var correctCount = progress?.CorrectCount ?? 0;
                var wrongCount = progress?.WrongCount ?? 0;
                var totalQuestionCount = correctCount + wrongCount;

                return new TopicProgressRow(
                    topic.TopicId,
                    topic.TopicTitle,
                    topic.Order,
                    topic.QuestionCount,
                    topic.CourseId,
                    topic.CourseName,
                    topic.LicenseId,
                    topic.LicenseName,
                    status,
                    correctCount,
                    wrongCount,
                    CalculateRate(correctCount, totalQuestionCount),
                    progress?.LastStudiedAt,
                    progress?.NextReviewAt);
            })
            .ToList();
    }

    private static bool IsStudiedStatus(StudyStatus status)
    {
        return status != StudyStatus.NotStarted;
    }

    private static decimal CalculateRate(int numerator, int denominator)
    {
        if (denominator <= 0)
        {
            return 0;
        }

        return Math.Round((decimal)numerator / denominator * 100, 1);
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff).Date;
    }

    private sealed record TopicCatalogRow(
        Guid TopicId,
        string TopicTitle,
        int Order,
        int QuestionCount,
        Guid CourseId,
        string CourseName,
        int CourseOrder,
        Guid LicenseId,
        string LicenseName);

    private sealed record CourseProgressRow(
        Guid CourseId,
        string CourseName,
        Guid LicenseId,
        string LicenseName,
        int TotalTopicCount,
        int StudiedTopicCount,
        bool IsCompleted,
        decimal ProgressPercentage,
        DateTime? LastActivityAt);

    private sealed record TopicProgressRow(
        Guid TopicId,
        string TopicTitle,
        int Order,
        int QuestionCount,
        Guid CourseId,
        string CourseName,
        Guid LicenseId,
        string LicenseName,
        StudyStatus Status,
        int CorrectCount,
        int WrongCount,
        decimal SuccessRate,
        DateTime? LastStudiedAt,
        DateTime? NextReviewAt);

    private sealed record QuizAttemptRow(
        Guid AttemptId,
        DateTime FinishedAt,
        int TotalQuestions,
        int CorrectCount,
        int WrongCount);
}
