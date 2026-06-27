using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IAdaptiveStudyPlanService
{
    Task<AdaptiveStudyPlanDto> GetTodayAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdaptiveStudyPlanDto>> GetWeekAsync(string userId, CancellationToken cancellationToken = default);

    Task<AdaptiveStudyPlanDto> RegenerateTodayAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdaptiveStudyRecommendationDto>> GetRecommendationsAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<AdaptiveStudyPlanDto?> CompleteTaskAsync(
        string userId,
        Guid taskId,
        CompleteAdaptiveStudyTaskDto dto,
        CancellationToken cancellationToken = default);
}

public class AdaptiveStudyPlanService(
    DataContext context,
    IGamificationRewardService gamificationRewardService,
    ILogger<AdaptiveStudyPlanService> logger) : IAdaptiveStudyPlanService
{
    private const int DefaultDailyStudyMinutes = 45;
    private const int ReviewMinutesPerQuestion = 2;
    private const int QuizMinutesPerQuestion = 2;

    public async Task<AdaptiveStudyPlanDto> GetTodayAsync(string userId, CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var existing = await GetStoredPlanAsync(userId, today, cancellationToken);

        if (existing is not null)
        {
            var contextData = await LoadUserContextAsync(userId, cancellationToken);
            return ToDto(existing, BuildRecommendations(contextData), BuildRiskTopics(contextData), BuildCriticalWeeklyTasks(contextData));
        }

        return await GenerateAndStoreAsync(userId, today, true, cancellationToken);
    }

    public async Task<IReadOnlyList<AdaptiveStudyPlanDto>> GetWeekAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var result = new List<AdaptiveStudyPlanDto>();

        for (var offset = 0; offset < 7; offset++)
        {
            result.Add(await GenerateAndStoreAsync(userId, today.AddDays(offset), offset == 0, cancellationToken));
        }

        return result;
    }

    public Task<AdaptiveStudyPlanDto> RegenerateTodayAsync(
        string userId,
        CancellationToken cancellationToken = default) =>
        GenerateAndStoreAsync(userId, DateOnly.FromDateTime(DateTime.UtcNow), true, cancellationToken);

    public async Task<IReadOnlyList<AdaptiveStudyRecommendationDto>> GetRecommendationsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var contextData = await LoadUserContextAsync(userId, cancellationToken);
        return BuildRecommendations(contextData);
    }

    public async Task<AdaptiveStudyPlanDto?> CompleteTaskAsync(
        string userId,
        Guid taskId,
        CompleteAdaptiveStudyTaskDto dto,
        CancellationToken cancellationToken = default)
    {
        var task = await context.AdaptiveStudyTasks
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
            .Include(x => x.Topic)
                .ThenInclude(x => x!.ParentTopic)
            .Include(x => x.Plan)
                .ThenInclude(x => x!.Tasks)
                    .ThenInclude(x => x.Topic)
                        .ThenInclude(x => x!.Course)
            .Include(x => x.Plan)
                .ThenInclude(x => x!.Tasks)
                    .ThenInclude(x => x.Topic)
                        .ThenInclude(x => x!.ParentTopic)
            .FirstOrDefaultAsync(x => x.Id == taskId && x.Plan != null && x.Plan.UserId == userId, cancellationToken);

        if (task?.Plan is null)
        {
            return null;
        }

        if (!task.Completed)
        {
            var now = DateTime.UtcNow;
            task.Completed = true;
            task.CompletedAt = now;
            task.ActualMinutes = Math.Clamp(dto.ActualMinutes ?? task.TargetMinutes, 1, 480);
            task.ActualQuestions = Math.Clamp(dto.ActualQuestions ?? task.TargetQuestions, 0, 500);
            task.UpdatedAt = now;

            await ApplyTaskProgressSignalAsync(userId, task, now, cancellationToken);
            RefreshPlanCompletion(task.Plan, now);
            await context.SaveChangesAsync(cancellationToken);

            await gamificationRewardService.ApplyAdaptiveTaskCompletionAsync(
                new AdaptiveStudyTaskCompletedEvent(
                    userId,
                    task.Id,
                    task.Type,
                    task.TopicId,
                    task.ActualMinutes,
                    task.ActualQuestions,
                    now),
                cancellationToken);

            logger.LogInformation(
                "Adaptive study task completed. UserId: {UserId}, TaskId: {TaskId}, TaskType: {TaskType}, ActualMinutes: {ActualMinutes}, ActualQuestions: {ActualQuestions}",
                userId,
                task.Id,
                task.Type,
                task.ActualMinutes,
                task.ActualQuestions);
        }

        var contextData = await LoadUserContextAsync(userId, cancellationToken);
        return ToDto(task.Plan, BuildRecommendations(contextData), BuildRiskTopics(contextData), BuildCriticalWeeklyTasks(contextData));
    }

    private async Task<AdaptiveStudyPlanDto> GenerateAndStoreAsync(
        string userId,
        DateOnly planDate,
        bool persist,
        CancellationToken cancellationToken)
    {
        var contextData = await LoadUserContextAsync(userId, cancellationToken);
        var plan = BuildDailyPlan(contextData, planDate);

        if (persist)
        {
            var existing = await context.AdaptiveStudyPlans
                .Include(x => x.Tasks)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.PlanDate == planDate, cancellationToken);

            if (existing is not null)
            {
                context.AdaptiveStudyTasks.RemoveRange(existing.Tasks);
                existing.EstimatedMinutes = plan.EstimatedMinutes;
                existing.CompletionRate = plan.CompletionRate;
                existing.GeneratedAt = plan.GeneratedAt;
                existing.DaysUntilExam = plan.DaysUntilExam;
                existing.EstimatedTargetCompletionRate = plan.EstimatedTargetCompletionRate;
                existing.Summary = plan.Summary;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.Tasks = plan.Tasks;
                plan = existing;
            }
            else
            {
                context.AdaptiveStudyPlans.Add(plan);
            }

            await context.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "Adaptive study plan generated. UserId: {UserId}, PlanDate: {PlanDate}, EstimatedMinutes: {EstimatedMinutes}, TaskCount: {TaskCount}",
                userId,
                planDate,
                plan.EstimatedMinutes,
                plan.Tasks.Count);
        }

        return ToDto(plan, BuildRecommendations(contextData), BuildRiskTopics(contextData), BuildCriticalWeeklyTasks(contextData));
    }

    private async Task<AdaptiveStudyPlan?> GetStoredPlanAsync(
        string userId,
        DateOnly planDate,
        CancellationToken cancellationToken) =>
        await context.AdaptiveStudyPlans
            .AsNoTracking()
            .Include(x => x.Tasks)
                .ThenInclude(x => x.Topic)
                    .ThenInclude(x => x!.Course)
            .Include(x => x.Tasks)
                .ThenInclude(x => x.Topic)
                    .ThenInclude(x => x!.ParentTopic)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.PlanDate == planDate, cancellationToken);

    private async Task ApplyTaskProgressSignalAsync(
        string userId,
        AdaptiveStudyTask task,
        DateTime completedAt,
        CancellationToken cancellationToken)
    {
        if (task.Type != AdaptiveStudyTaskType.TopicStudy || !task.TopicId.HasValue)
        {
            return;
        }

        var progress = await context.StudyProgresses
            .FirstOrDefaultAsync(x => x.UserId == userId && x.TopicId == task.TopicId.Value, cancellationToken);

        if (progress is null)
        {
            progress = new StudyProgress
            {
                UserId = userId,
                TopicId = task.TopicId.Value,
                Status = StudyStatus.InProgress
            };
            context.StudyProgresses.Add(progress);
        }

        if (progress.Status == StudyStatus.NotStarted)
        {
            progress.Status = StudyStatus.InProgress;
        }

        progress.LastStudiedAt = completedAt;
        progress.NextReviewAt ??= completedAt.AddDays(2);
        progress.UpdatedAt = completedAt;
    }

    private static void RefreshPlanCompletion(AdaptiveStudyPlan plan, DateTime completedAt)
    {
        var taskCount = plan.Tasks.Count;
        plan.CompletionRate = taskCount == 0
            ? 100
            : Math.Round((decimal)plan.Tasks.Count(x => x.Completed) / taskCount * 100, 1);
        plan.UpdatedAt = completedAt;
    }

    private async Task<AdaptiveStudyContext> LoadUserContextAsync(string userId, CancellationToken cancellationToken)
    {
        var settings = await context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? new UserSettings { UserId = userId };

        var activeLicenseIds = (await context.UserLicenseAccesses
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .ToListAsync(cancellationToken))
            .Where(access => UserLicenseAccessRules.IsCurrentlyActive(access))
            .Select(x => x.LicenseId)
            .ToHashSet();

        var topics = await context.Topics
            .AsNoTracking()
            .Include(x => x.Course)
            .Include(x => x.ParentTopic)
            .Where(x =>
                x.Course != null &&
                activeLicenseIds.Contains(x.Course.LicenseId) &&
                (x.Type == TopicType.SubTopic || x.ParentTopicId.HasValue))
            .OrderBy(x => x.Course!.Order)
            .ThenBy(x => x.ParentTopic != null ? x.ParentTopic.Order : 0)
            .ThenBy(x => x.Order)
            .Select(x => new TopicSnapshot(
                x.Id,
                x.Title,
                x.ParentTopicId,
                x.ParentTopic != null ? x.ParentTopic.Title : null,
                x.Course!.Name,
                x.CourseId,
                x.Questions.Count(q => !q.IsDeleted && q.ReviewStatus == ReviewStatus.Approved)))
            .ToListAsync(cancellationToken);

        var topicIds = topics.Select(x => x.TopicId).ToHashSet();
        var progresses = await context.StudyProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && topicIds.Contains(x.TopicId))
            .ToDictionaryAsync(x => x.TopicId, cancellationToken);

        var now = DateTime.UtcNow;
        var reviewDueByTopic = await context.QuestionStudyProgresses
            .AsNoTracking()
            .Where(x =>
                x.StudentId == userId &&
                x.NextReviewAt <= now.AddDays(2) &&
                x.Question != null &&
                topicIds.Contains(x.Question.TopicId))
            .GroupBy(x => x.Question!.TopicId)
            .Select(x => new ReviewTopicCount(
                x.Key,
                x.Count(item => item.NextReviewAt <= now),
                x.Count(item => item.NextReviewAt < now.Date),
                x.Count()))
            .ToListAsync(cancellationToken);

        var reviewByTopic = reviewDueByTopic.ToDictionary(x => x.TopicId);

        var wrongByTopic = await context.WrongAnswerQueues
            .AsNoTracking()
            .Where(x =>
                x.StudentId == userId &&
                !x.IsMastered &&
                x.Question != null &&
                topicIds.Contains(x.Question.TopicId))
            .GroupBy(x => x.Question!.TopicId)
            .Select(x => new WrongTopicCount(x.Key, x.Sum(item => item.WrongCount), x.Count()))
            .ToListAsync(cancellationToken);

        var wrongTopicMap = wrongByTopic.ToDictionary(x => x.TopicId);

        var quizPerformance = await context.QuizAnswers
            .AsNoTracking()
            .Where(x =>
                x.QuizAttempt != null &&
                x.QuizAttempt.UserId == userId &&
                x.Question != null &&
                topicIds.Contains(x.Question.TopicId))
            .GroupBy(x => x.Question!.TopicId)
            .Select(x => new TopicPerformance(
                x.Key,
                x.Count(),
                x.Count(answer => answer.IsCorrect),
                x.Count(answer => !answer.IsCorrect)))
            .ToListAsync(cancellationToken);

        var performanceByTopic = quizPerformance.ToDictionary(x => x.TopicId);

        var priorities = topics
            .Select(topic => CalculatePriority(topic, progresses, reviewByTopic, wrongTopicMap, performanceByTopic, settings, now))
            .OrderByDescending(x => x.PriorityScore)
            .ToList();

        return new AdaptiveStudyContext(settings, priorities);
    }

    private static TopicPriority CalculatePriority(
        TopicSnapshot topic,
        IReadOnlyDictionary<Guid, StudyProgress> progressByTopic,
        IReadOnlyDictionary<Guid, ReviewTopicCount> reviewByTopic,
        IReadOnlyDictionary<Guid, WrongTopicCount> wrongByTopic,
        IReadOnlyDictionary<Guid, TopicPerformance> performanceByTopic,
        UserSettings settings,
        DateTime now)
    {
        progressByTopic.TryGetValue(topic.TopicId, out var progress);
        reviewByTopic.TryGetValue(topic.TopicId, out var review);
        wrongByTopic.TryGetValue(topic.TopicId, out var wrong);
        performanceByTopic.TryGetValue(topic.TopicId, out var performance);

        var examUrgency = ResolveExamUrgency(settings.ExamDate, now);
        var reviewUrgency = Math.Min(35, (review?.DueTodayCount ?? 0) * 4 + (review?.OverdueCount ?? 0) * 6);
        var wrongCount = wrong?.WrongCount ?? progress?.WrongCount ?? 0;
        var successRate = ResolveSuccessRate(progress, performance);
        var weakTopicScore = Math.Clamp((100 - successRate) / 2 + wrongCount * 2, 0, 35);
        var progressGap = progress?.Status is StudyStatus.Studied or StudyStatus.Mastered ? 0 : 20;
        var timeAvailability = Math.Clamp(settings.DailyStudyMinutes / 30m, 1, 8);
        var priority = Math.Round(examUrgency + weakTopicScore + reviewUrgency + progressGap + timeAvailability, 2);

        return new TopicPriority(
            topic.TopicId,
            topic.TopicTitle,
            topic.MainTopicId,
            topic.MainTopicTitle,
            topic.CourseName,
            topic.QuestionCount,
            progress?.Status ?? StudyStatus.NotStarted,
            successRate,
            wrongCount,
            review?.DueTodayCount ?? 0,
            review?.OverdueCount ?? 0,
            priority);
    }

    private AdaptiveStudyPlan BuildDailyPlan(AdaptiveStudyContext contextData, DateOnly planDate)
    {
        var settings = contextData.Settings;
        var priorities = contextData.Priorities;
        var dailyMinutes = ResolveDailyCapacity(settings, planDate);
        var daysUntilExam = ResolveDaysUntilExam(settings.ExamDate);
        var tasks = new List<AdaptiveStudyTask>();
        var topRisk = priorities.FirstOrDefault();
        var reviewQuestionCount = Math.Min(30, Math.Max(0, priorities.Sum(x => x.DueReviewCount)));
        var reviewMinutes = Math.Min(dailyMinutes / 3, reviewQuestionCount * ReviewMinutesPerQuestion);

        if (settings.AutoReviewSuggestions && reviewQuestionCount > 0 && reviewMinutes > 0)
        {
            tasks.Add(new AdaptiveStudyTask
            {
                Type = AdaptiveStudyTaskType.Review,
                TargetMinutes = reviewMinutes,
                TargetQuestions = Math.Min(reviewQuestionCount, Math.Max(5, reviewMinutes / ReviewMinutesPerQuestion)),
                Priority = priorities.Max(x => x.PriorityScore),
                ActionUrl = "/reviews/today",
                Title = "Tekrar kuyruğunu bitir",
                Description = "Vadesi gelen soruları önce tamamla; unutma eğrisini bugün kapat."
            });
        }

        foreach (var topic in priorities
            .Where(x => x.Status is not StudyStatus.Studied and not StudyStatus.Mastered)
            .Take(2))
        {
            tasks.Add(new AdaptiveStudyTask
            {
                Type = AdaptiveStudyTaskType.TopicStudy,
                TopicId = topic.TopicId,
                TargetMinutes = Math.Max(15, Math.Min(45, dailyMinutes / 3)),
                TargetQuestions = 0,
                Priority = topic.PriorityScore,
                ActionUrl = $"/study/{topic.TopicId}",
                Title = topic.TopicTitle,
                Description = BuildTopicTaskDescription(topic)
            });
        }

        if (topRisk is not null)
        {
            var questionTarget = Math.Clamp(settings.DefaultQuestionCount, 10, 40);
            tasks.Add(new AdaptiveStudyTask
            {
                Type = AdaptiveStudyTaskType.Quiz,
                TopicId = topRisk.TopicId,
                TargetMinutes = Math.Min(dailyMinutes / 3, questionTarget * QuizMinutesPerQuestion),
                TargetQuestions = questionTarget,
                Priority = topRisk.PriorityScore,
                ActionUrl = settings.DefaultQuizMode switch
                {
                    UserDefaultQuizMode.Course => "/quiz/course-practice",
                    UserDefaultQuizMode.WrongAnswers => "/quiz/wrong-answers",
                    UserDefaultQuizMode.TrialExam => "/quizzes",
                    _ => "/quiz"
                },
                Title = "Öncelikli quiz",
                Description = $"{BuildTopicPath(topRisk)} için hedefli soru çözümü yap."
            });
        }

        var wrongTopic = priorities.FirstOrDefault(x => x.WrongCount > 0);
        if (settings.AutoReviewSuggestions && wrongTopic is not null)
        {
            tasks.Add(new AdaptiveStudyTask
            {
                Type = AdaptiveStudyTaskType.WrongAnswerAnalysis,
                TopicId = wrongTopic.TopicId,
                TargetMinutes = Math.Min(20, Math.Max(10, dailyMinutes / 5)),
                TargetQuestions = Math.Min(15, Math.Max(5, wrongTopic.WrongCount)),
                Priority = wrongTopic.PriorityScore,
                ActionUrl = "/quiz/wrong-answers",
                Title = "Yanlış analizi",
                Description = $"{BuildTopicPath(wrongTopic)} konusunda biriken yanlışları tekrar çöz."
            });
        }

        var estimatedMinutes = tasks.Sum(x => x.TargetMinutes);
        if (estimatedMinutes > dailyMinutes && estimatedMinutes > 0)
        {
            ScaleTasks(tasks, dailyMinutes);
            estimatedMinutes = tasks.Sum(x => x.TargetMinutes);
        }

        var completedTopicCount = priorities.Count(x => x.Status is StudyStatus.Studied or StudyStatus.Mastered);
        var targetCompletion = priorities.Count == 0
            ? 0
            : Math.Round((decimal)completedTopicCount / priorities.Count * 100, 1);

        return new AdaptiveStudyPlan
        {
            UserId = settings.UserId,
            PlanDate = planDate,
            EstimatedMinutes = estimatedMinutes,
            CompletionRate = 0,
            GeneratedAt = DateTime.UtcNow,
            DaysUntilExam = daysUntilExam,
            EstimatedTargetCompletionRate = EstimateTargetCompletion(targetCompletion, settings, priorities.Count),
            Summary = BuildSummary(daysUntilExam, estimatedMinutes, topRisk?.TopicTitle),
            Tasks = tasks
        };
    }

    private static void ScaleTasks(List<AdaptiveStudyTask> tasks, int dailyMinutes)
    {
        var total = tasks.Sum(x => x.TargetMinutes);
        if (total <= dailyMinutes || total == 0)
        {
            return;
        }

        foreach (var task in tasks)
        {
            task.TargetMinutes = Math.Max(5, (int)Math.Round((decimal)task.TargetMinutes / total * dailyMinutes));
            if (task.Type is AdaptiveStudyTaskType.Review or AdaptiveStudyTaskType.Quiz or AdaptiveStudyTaskType.WrongAnswerAnalysis)
            {
                task.TargetQuestions = Math.Max(1, Math.Min(task.TargetQuestions, task.TargetMinutes / 2));
            }
        }
    }

    private static int ResolveDailyCapacity(UserSettings settings, DateOnly planDate)
    {
        if (!IsPreferredStudyDay(settings.PreferredStudyDays, planDate))
        {
            return Math.Max(20, settings.DailyStudyMinutes / 2);
        }

        return Math.Clamp(settings.DailyStudyMinutes <= 0 ? DefaultDailyStudyMinutes : settings.DailyStudyMinutes, 15, 240);
    }

    private static bool IsPreferredStudyDay(string preferredStudyDays, DateOnly planDate)
    {
        var day = (int)planDate.DayOfWeek;
        var parsed = preferredStudyDays
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(value => int.TryParse(value, out var parsedDay) ? parsedDay : -1)
            .ToHashSet();

        return parsed.Count == 0 || parsed.Contains(day);
    }

    private static int ResolveDaysUntilExam(DateTime? examDate)
    {
        if (!examDate.HasValue)
        {
            return 0;
        }

        return Math.Max(0, (int)Math.Ceiling((examDate.Value.Date - DateTime.UtcNow.Date).TotalDays));
    }

    private static decimal ResolveExamUrgency(DateTime? examDate, DateTime now)
    {
        if (!examDate.HasValue)
        {
            return 8;
        }

        var days = Math.Max(1, (examDate.Value.Date - now.Date).TotalDays);
        return Math.Clamp(45m - (decimal)days / 3, 8, 45);
    }

    private static decimal ResolveSuccessRate(StudyProgress? progress, TopicPerformance? performance)
    {
        if (performance is not null && performance.AnswerCount > 0)
        {
            return Math.Round((decimal)performance.CorrectCount / performance.AnswerCount * 100, 1);
        }

        var progressTotal = (progress?.CorrectCount ?? 0) + (progress?.WrongCount ?? 0);
        return progressTotal == 0
            ? 50
            : Math.Round((decimal)(progress?.CorrectCount ?? 0) / progressTotal * 100, 1);
    }

    private static decimal EstimateTargetCompletion(decimal currentCompletion, UserSettings settings, int topicCount)
    {
        if (!settings.ExamDate.HasValue || topicCount == 0)
        {
            return currentCompletion;
        }

        var days = ResolveDaysUntilExam(settings.ExamDate);
        var weeklyCapacity = Math.Max(settings.WeeklyStudyMinutes, settings.DailyStudyMinutes * 7);
        var projectedStudyBlocks = Math.Max(0, days / 7m * weeklyCapacity / 45m);
        var projectedCompletion = currentCompletion + projectedStudyBlocks / topicCount * 100;
        return Math.Min(100, Math.Round(projectedCompletion, 1));
    }

    private static string BuildSummary(int daysUntilExam, int estimatedMinutes, string? topTopic)
    {
        var examText = daysUntilExam > 0 ? $"Sınava {daysUntilExam} gün kaldı." : "Sınav tarihi girilmedi.";
        var topicText = string.IsNullOrWhiteSpace(topTopic) ? "Öncelik bugünkü tekrar ve quiz dengesinde." : $"En riskli konu: {topTopic}.";
        return $"{examText} Bugün önerilen süre {estimatedMinutes} dk. {topicText}";
    }

    private static string BuildTopicTaskDescription(TopicPriority topic)
    {
        var path = BuildTopicPath(topic);
        return $"{path} için eksik ilerleme ve zayıf performans nedeniyle öncelikli alt konu.";
    }

    private static string BuildTopicPath(TopicPriority topic)
    {
        if (!string.IsNullOrWhiteSpace(topic.MainTopicTitle))
        {
            return $"{topic.CourseName} > {topic.MainTopicTitle} > {topic.TopicTitle}";
        }

        return $"{topic.CourseName} > {topic.TopicTitle}";
    }

    private static IReadOnlyList<AdaptiveStudyRecommendationDto> BuildRecommendations(AdaptiveStudyContext contextData)
    {
        var recommendations = new List<AdaptiveStudyRecommendationDto>();
        var topRisk = contextData.Priorities.FirstOrDefault();

        if (contextData.Priorities.Sum(x => x.DueReviewCount) > 0)
        {
            recommendations.Add(new AdaptiveStudyRecommendationDto(
                null,
                "Tekrar zamanı geldi",
                "Bugünkü tekrar kuyruğunu önce tamamla.",
                contextData.Priorities.Max(x => x.PriorityScore),
                "/reviews/today"));
        }

        if (topRisk is not null)
        {
            recommendations.Add(new AdaptiveStudyRecommendationDto(
                topRisk.TopicId,
                topRisk.TopicTitle,
                "Zayıflık, ilerleme açığı ve tekrar ihtiyacına göre en yüksek öncelikli konu.",
                topRisk.PriorityScore,
                $"/study/{topRisk.TopicId}"));
        }

        if (contextData.Priorities.Any(x => x.WrongCount > 0))
        {
            recommendations.Add(new AdaptiveStudyRecommendationDto(
                null,
                "Yanlış analizi",
                "Biriken yanlışları çözerek tekrar kuyruğunu temizle.",
                contextData.Priorities.Where(x => x.WrongCount > 0).Max(x => x.PriorityScore),
                "/quiz/wrong-answers"));
        }

        return recommendations;
    }

    private static IReadOnlyList<AdaptiveStudyRiskTopicDto> BuildRiskTopics(AdaptiveStudyContext contextData) =>
        contextData.Priorities
            .Where(x => x.WrongCount > 0 || x.DueReviewCount > 0 || x.SuccessRate < 70)
            .Take(5)
            .Select(x => new AdaptiveStudyRiskTopicDto(
                x.TopicId,
                x.TopicTitle,
                x.MainTopicId,
                x.MainTopicTitle,
                x.CourseName,
                x.PriorityScore,
                x.SuccessRate,
                x.WrongCount,
                x.DueReviewCount))
            .ToList();

    private static IReadOnlyList<string> BuildCriticalWeeklyTasks(AdaptiveStudyContext contextData)
    {
        var tasks = new List<string>();
        var dueReviewCount = contextData.Priorities.Sum(x => x.DueReviewCount);
        var incompleteCount = contextData.Priorities.Count(x => x.Status is not StudyStatus.Studied and not StudyStatus.Mastered);

        if (dueReviewCount > 0)
        {
            tasks.Add($"{dueReviewCount} tekrar sorusunu hafta icinde bitir.");
        }

        if (incompleteCount > 0)
        {
            tasks.Add($"En az {Math.Min(5, incompleteCount)} eksik konuyu calis.");
        }

        if (contextData.Priorities.Any(x => x.WrongCount > 0))
        {
            tasks.Add("Yanlışlarım kuyruğundan hedefli tekrar oturumu yap.");
        }

        return tasks;
    }

    private static AdaptiveStudyPlanDto ToDto(
        AdaptiveStudyPlan plan,
        IReadOnlyList<AdaptiveStudyRecommendationDto> recommendations,
        IReadOnlyList<AdaptiveStudyRiskTopicDto> riskyTopics,
        IReadOnlyList<string> criticalWeeklyTasks) =>
        new(
            plan.Id,
            plan.PlanDate,
            plan.EstimatedMinutes,
            plan.CompletionRate,
            plan.GeneratedAt,
            plan.DaysUntilExam,
            plan.EstimatedTargetCompletionRate,
            plan.Summary ?? string.Empty,
            plan.Tasks
                .OrderByDescending(x => x.Priority)
                .Select(x => new AdaptiveStudyTaskDto(
                    x.Id,
                    x.Type,
                    x.TopicId,
                    x.Topic?.Title,
                    x.Topic?.ParentTopicId,
                    x.Topic?.ParentTopic?.Title,
                    x.Topic?.Course?.Name,
                    x.TargetMinutes,
                    x.TargetQuestions,
                    x.Priority,
                    x.ActionUrl,
                    x.Title,
                    x.Description,
                    x.Completed,
                    x.CompletedAt,
                    x.ActualMinutes,
                    x.ActualQuestions))
                .ToList(),
            recommendations,
            riskyTopics,
            criticalWeeklyTasks);

    private sealed record AdaptiveStudyContext(UserSettings Settings, IReadOnlyList<TopicPriority> Priorities);

    private sealed record TopicSnapshot(
        Guid TopicId,
        string TopicTitle,
        Guid? MainTopicId,
        string? MainTopicTitle,
        string CourseName,
        Guid CourseId,
        int QuestionCount);

    private sealed record ReviewTopicCount(Guid TopicId, int DueTodayCount, int OverdueCount, int UpcomingCount);

    private sealed record WrongTopicCount(Guid TopicId, int WrongCount, int QueueCount);

    private sealed record TopicPerformance(Guid TopicId, int AnswerCount, int CorrectCount, int WrongCount);

    private sealed record TopicPriority(
        Guid TopicId,
        string TopicTitle,
        Guid? MainTopicId,
        string? MainTopicTitle,
        string CourseName,
        int QuestionCount,
        StudyStatus Status,
        decimal SuccessRate,
        int WrongCount,
        int DueReviewCount,
        int OverdueReviewCount,
        decimal PriorityScore);
}
