using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IStudentExperienceService
{
    Task<StudentProgramDto> GetProgram(string userId);

    Task<TopicStudyPageDto?> GetTopicStudyPage(string userId, Guid topicId);

    Task MarkTopicCompleted(string userId, Guid topicId, bool isCompleted);

    Task<StudentAnalyticsDto> GetAnalytics(string userId);

    Task<IReadOnlyList<TrialAttemptSummaryDto>> GetTrialHistory(string userId);

    Task<IReadOnlyList<QuizResultHistoryItemDto>> GetResultHistory(string userId);

    Task<TrialAttemptDetailDto?> GetTrialHistoryDetail(string userId, Guid attemptId);

    Task<StudentContinueTrialDto?> GetActiveTrial(string userId);
}

public class StudentExperienceService(
    DataContext context,
    ILicenseAccessService accessService,
    IProgressService progressService,
    IXPService xpService,
    IBadgeService badgeService,
    ILogger<StudentExperienceService> logger) : IStudentExperienceService
{
    public async Task<StudentProgramDto> GetProgram(string userId)
    {
        var accesses = await context.UserLicenseAccesses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync();

        var licenses = await context.Licenses
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync();

        var progressByLicense = (await progressService.GetLicenseProgresses(userId))
            .ToDictionary(x => x.LicenseId);

        var lastProgress = await context.StudyProgresses
            .AsNoTracking()
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
                    .ThenInclude(x => x!.License)
            .Where(x => x.UserId == userId && x.LastStudiedAt.HasValue)
            .OrderByDescending(x => x.LastStudiedAt)
            .FirstOrDefaultAsync();

        var activeTrial = await GetActiveTrial(userId);

        var upcomingGoals = await context.StudyProgresses
            .AsNoTracking()
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
            .Where(x => x.UserId == userId && x.NextReviewAt.HasValue)
            .OrderBy(x => x.NextReviewAt)
            .Take(5)
            .Select(x => new StudentUpcomingGoalDto(
                x.TopicId,
                x.Topic!.CourseId,
                x.Topic.Course!.Name,
                x.Topic.Title,
                x.NextReviewAt,
                x.Status))
            .ToListAsync();

        return new StudentProgramDto(
            licenses.Select(license =>
            {
                var hasAccess = accesses.Any(x => x.LicenseId == license.Id && accessService.IsCurrentlyActive(x));
                progressByLicense.TryGetValue(license.Id, out var progress);

                return new StudentProgramLicenseDto(
                    license.Id,
                    license.Name,
                    hasAccess,
                    progress?.ProgressPercentage ?? 0,
                    progress?.CompletedCourseCount ?? 0,
                    progress?.TotalCourseCount ?? 0,
                    progress?.LastActivityAt is not null && lastProgress?.Topic?.Course?.LicenseId == license.Id
                        ? lastProgress.Topic.Course.Name
                        : null,
                    progress?.LastActivityAt);
            }).ToList(),
            lastProgress is null
                ? null
                : new StudentContinueLearningDto(
                    lastProgress.Topic!.Course!.LicenseId,
                    lastProgress.Topic.Course.License!.Name,
                    lastProgress.Topic.CourseId,
                    lastProgress.Topic.Course.Name,
                    lastProgress.TopicId,
                    lastProgress.Topic.Title,
                    lastProgress.LastStudiedAt),
            activeTrial,
            upcomingGoals);
    }

    public async Task<TopicStudyPageDto?> GetTopicStudyPage(string userId, Guid topicId)
    {
        if (!await accessService.CanAccessTopic(userId, topicId))
        {
            return null;
        }

        var topic = await context.Topics
            .AsNoTracking()
            .Include(x => x.Course)
                .ThenInclude(x => x!.License)
            .FirstOrDefaultAsync(x => x.Id == topicId);

        if (topic is null)
        {
            return null;
        }

        var notes = await context.StudyNotes
            .AsNoTracking()
            .Where(x => x.TopicId == topicId && x.ReviewStatus == ReviewStatus.Approved)
            .OrderBy(x => x.Title)
            .Select(x => new StudyNoteDto(
                x.Id,
                x.TopicId,
                x.Title,
                x.Content,
                x.SourceReference,
                x.IsAiGenerated,
                x.ReviewStatus,
                x.AccessLevel,
                x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                x.ReviewedAt,
                x.ReviewComment))
            .ToListAsync();

        var sourceDocuments = await context.SourceDocuments
            .AsNoTracking()
            .Where(x => x.CourseId == topic.CourseId)
            .OrderBy(x => x.Title)
            .Select(x => new SourceDocumentDto(
                x.Id,
                x.CourseId,
                x.Title,
                x.FileName,
                x.FilePath,
                x.SourceName,
                x.SourcePublishedAt,
                x.SourceUpdatedAt,
                x.PageCount,
                x.TextExtractedAt,
                x.ReviewStatus,
                x.AccessLevel,
                x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                x.ReviewedAt,
                x.ReviewComment))
            .ToListAsync();

        var relatedQuestions = await context.Questions
            .AsNoTracking()
            .Where(x => x.TopicId == topicId && x.ReviewStatus == ReviewStatus.Approved)
            .OrderBy(x => x.Difficulty)
            .ThenBy(x => x.CreatedAt)
            .Take(8)
            .Select(x => new TopicQuestionPreviewDto(
                x.Id,
                x.Text,
                x.Difficulty,
                x.Type))
            .ToListAsync();

        var progress = await context.StudyProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.TopicId == topicId);

        var subTopics = await BuildSubTopicDtosAsync(userId, topic.Id);

        var correctCount = progress?.CorrectCount ?? 0;
        var wrongCount = progress?.WrongCount ?? 0;
        var total = correctCount + wrongCount;
        var successRate = total == 0 ? 0 : Math.Round((decimal)correctCount / total * 100, 1);
        var isCompleted = progress?.Status == StudyStatus.Mastered;

        return new TopicStudyPageDto(
            topic.Id,
            topic.CourseId,
            topic.Course!.LicenseId,
            topic.Course.License!.Name,
            topic.Course.Name,
            topic.Title,
            topic.Type,
            topic.Summary,
            topic.ImportantPoints,
            topic.CommonMistakes,
            topic.Formulas,
            progress?.Status ?? StudyStatus.NotStarted,
            correctCount,
            wrongCount,
            successRate,
            progress?.LastStudiedAt,
            progress?.NextReviewAt,
            isCompleted,
            new StudentTopicVideoPlaceholderDto(
                false,
                "Video dersi yakında",
                "Bu konu için video içerik alanı hazır. İleride ders videoları bu bölümden yayınlanacak."),
            notes,
            sourceDocuments,
            relatedQuestions,
            subTopics);
    }

    private async Task<IReadOnlyList<TopicStudySubTopicDto>> BuildSubTopicDtosAsync(string userId, Guid mainTopicId)
    {
        var subTopics = await context.Topics
            .AsNoTracking()
            .Where(x => x.ParentTopicId == mainTopicId)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Title)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Summary,
                QuestionCount = x.Questions.Count(q => !q.IsDeleted && q.ReviewStatus == ReviewStatus.Approved)
            })
            .ToListAsync();

        if (subTopics.Count == 0)
        {
            return [];
        }

        var subTopicIds = subTopics.Select(x => x.Id).ToHashSet();
        var progresses = await context.StudyProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && subTopicIds.Contains(x.TopicId))
            .ToDictionaryAsync(x => x.TopicId);

        return subTopics.Select(subTopic =>
        {
            progresses.TryGetValue(subTopic.Id, out var progress);
            var correctCount = progress?.CorrectCount ?? 0;
            var wrongCount = progress?.WrongCount ?? 0;
            var total = correctCount + wrongCount;
            var successRate = total == 0 ? 0 : Math.Round((decimal)correctCount / total * 100, 1);

            return new TopicStudySubTopicDto(
                subTopic.Id,
                subTopic.Title,
                subTopic.Summary,
                subTopic.QuestionCount,
                progress?.Status ?? StudyStatus.NotStarted,
                correctCount,
                wrongCount,
                successRate,
                progress?.Status == StudyStatus.Mastered);
        }).ToList();
    }

    public async Task MarkTopicCompleted(string userId, Guid topicId, bool isCompleted)
    {
        var now = DateTime.UtcNow;
        var progress = await context.StudyProgresses
            .FirstOrDefaultAsync(x => x.UserId == userId && x.TopicId == topicId);

        if (progress is null)
        {
            progress = new StudyProgress
            {
                UserId = userId,
                TopicId = topicId
            };
            context.StudyProgresses.Add(progress);
        }

        progress.Status = isCompleted ? StudyStatus.Mastered : StudyStatus.InProgress;
        progress.LastStudiedAt = now;
        progress.NextReviewAt = isCompleted ? now.AddDays(14) : now.AddDays(2);
        progress.UpdatedAt = now;

        await context.SaveChangesAsync();

        if (isCompleted)
        {
            await xpService.TrackActivityAsync(userId, now);
            var grantedXp = await xpService.AwardXpAsync(
                userId,
                20,
                "Konu tamamlama",
                "TopicCompletion",
                topicId.ToString());
            await badgeService.EvaluateAndUnlockAsync(userId);

            logger.LogInformation(
                "Topic marked completed. UserId: {UserId}, TopicId: {TopicId}, GrantedXp: {GrantedXp}, NextReviewAt: {NextReviewAt}",
                userId,
                topicId,
                grantedXp,
                progress.NextReviewAt);

            return;
        }

        logger.LogInformation(
            "Topic marked in progress. UserId: {UserId}, TopicId: {TopicId}, NextReviewAt: {NextReviewAt}",
            userId,
            topicId,
            progress.NextReviewAt);
    }

    public async Task<StudentAnalyticsDto> GetAnalytics(string userId)
    {
        var statistics = await progressService.GetStatistics(userId);
        var topicProgresses = await context.StudyProgresses
            .AsNoTracking()
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
            .Where(x => x.UserId == userId)
            .ToListAsync();

        var strengths = topicProgresses
            .Where(x => x.CorrectCount + x.WrongCount > 0)
            .Select(x => ToTopicStrength(x))
            .OrderByDescending(x => x.SuccessRate)
            .ThenByDescending(x => x.CorrectCount)
            .Take(5)
            .ToList();

        var weaknesses = topicProgresses
            .Where(x => x.CorrectCount + x.WrongCount > 0)
            .Select(x => ToTopicStrength(x))
            .OrderBy(x => x.SuccessRate)
            .ThenByDescending(x => x.WrongCount)
            .Take(5)
            .ToList();

        var trialPerformances = await context.QuizAttempts
            .AsNoTracking()
            .Include(x => x.TrialExam)
            .Where(x => x.UserId == userId && x.Mode == QuizMode.TrialExam && x.FinishedAt.HasValue && x.TrialExamId.HasValue)
            .OrderByDescending(x => x.FinishedAt)
            .Take(10)
            .Select(x => new StudentTrialPerformanceDto(
                x.Id,
                x.TrialExamId!.Value,
                x.TrialExam != null ? x.TrialExam.Title : "Deneme",
                x.CorrectCount,
                x.WrongCount,
                x.TotalQuestions,
                x.TotalQuestions == 0 ? 0 : Math.Round((decimal)x.CorrectCount / x.TotalQuestions * 100, 1),
                x.TrialExam != null ? x.TrialExam.DurationMinutes : null,
                x.FinishedAt.HasValue ? (int)Math.Max(1, Math.Round((x.FinishedAt.Value - x.StartedAt).TotalMinutes)) : 0,
                x.FinishedAt!.Value))
            .ToListAsync();

        return new StudentAnalyticsDto(
            statistics.SuccessRate,
            statistics.TotalQuestionCount,
            statistics.SolvedQuizCount,
            statistics.TodayQuestionCount,
            statistics.WeeklyQuestionCount,
            statistics.TodayQuestionCount * 1.5m,
            statistics.WeeklyQuestionCount * 1.5m,
            strengths,
            weaknesses,
            statistics.DailyTimeline,
            statistics.WeeklyTimeline,
            trialPerformances);
    }

    public async Task<IReadOnlyList<TrialAttemptSummaryDto>> GetTrialHistory(string userId)
    {
        return await context.QuizAttempts
            .AsNoTracking()
            .Include(x => x.TrialExam)
            .Where(x => x.UserId == userId && x.Mode == QuizMode.TrialExam && x.TrialExamId.HasValue)
            .OrderByDescending(x => x.StartedAt)
            .Select(x => new TrialAttemptSummaryDto(
                x.Id,
                x.TrialExamId!.Value,
                x.TrialExam != null ? x.TrialExam.Title : "Deneme",
                x.CorrectCount,
                x.WrongCount,
                x.TotalQuestions,
                x.TotalQuestions == 0 ? 0 : Math.Round((decimal)x.CorrectCount / x.TotalQuestions * 100, 1),
                x.TrialExam != null ? x.TrialExam.DurationMinutes : null,
                x.FinishedAt.HasValue ? (int)Math.Max(1, Math.Round((x.FinishedAt.Value - x.StartedAt).TotalMinutes)) : 0,
                x.StartedAt,
                x.FinishedAt,
                x.FinishedAt.HasValue))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<QuizResultHistoryItemDto>> GetResultHistory(string userId)
    {
        var attempts = await context.QuizAttempts
            .AsNoTracking()
            .Include(x => x.Course)
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
            .Include(x => x.TrialExam)
            .Where(x => x.UserId == userId && x.FinishedAt.HasValue)
            .OrderByDescending(x => x.FinishedAt)
            .ToListAsync();

        return attempts
            .Select(attempt =>
            {
                var emptyCount = Math.Max(
                    0,
                    attempt.TotalQuestions - attempt.CorrectCount - attempt.WrongCount);
                var course = attempt.Course ?? attempt.Topic?.Course;

                return new QuizResultHistoryItemDto(
                    attempt.Id,
                    ResolveResultTitle(attempt),
                    attempt.Mode,
                    attempt.CourseId ?? attempt.Topic?.CourseId,
                    course?.Name,
                    attempt.TopicId,
                    attempt.Topic?.Title,
                    attempt.CorrectCount,
                    attempt.WrongCount,
                    emptyCount,
                    attempt.TotalQuestions,
                    attempt.TotalQuestions == 0
                        ? 0
                        : Math.Round((decimal)attempt.CorrectCount / attempt.TotalQuestions * 100, 1),
                    (int)Math.Max(1, (attempt.FinishedAt!.Value - attempt.StartedAt).TotalSeconds),
                    attempt.StartedAt,
                    attempt.FinishedAt.Value);
            })
            .ToList();
    }

    private static string ResolveResultTitle(QuizAttempt attempt) =>
        attempt.Mode switch
        {
            QuizMode.TrialExam when attempt.TrialExam is not null => attempt.TrialExam.Title,
            QuizMode.TopicPractice when attempt.Topic is not null =>
                $"{attempt.Topic.Course?.Name ?? "Ders"} · {attempt.Topic.Title}",
            QuizMode.CoursePractice when attempt.Course is not null => $"{attempt.Course.Name} · Ders Testi",
            QuizMode.WrongAnswers => "Yanlışlarım Tekrar Testi",
            QuizMode.MixedPractice => "Karışık Pratik Testi",
            QuizMode.FreeTrial => attempt.TrialExam?.Title ?? "Ücretsiz Deneme",
            QuizMode.LicensedQuiz => attempt.TrialExam?.Title ?? "Lisanslı Deneme",
            QuizMode.MockExam => attempt.TrialExam?.Title ?? "Deneme Sınavı",
            QuizMode.PastExams => "Çıkmış Sorular Testi",
            QuizMode.ReviewSession => "Tekrar Oturumu",
            _ => "Quiz Sonucu"
        };

    public async Task<TrialAttemptDetailDto?> GetTrialHistoryDetail(string userId, Guid attemptId)
    {
        var attempt = await context.QuizAttempts
            .AsNoTracking()
            .Include(x => x.TrialExam)
            .Include(x => x.Answers)
            .Include(x => x.AttemptQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .FirstOrDefaultAsync(x => x.Id == attemptId && x.UserId == userId && x.Mode == QuizMode.TrialExam);

        if (attempt is null || !attempt.FinishedAt.HasValue)
        {
            return null;
        }

        var answersByQuestionId = attempt.Answers.ToDictionary(x => x.QuestionId);
        var details = attempt.AttemptQuestions
            .OrderBy(x => x.Order)
            .Select(x =>
            {
                var question = x.Question!;
                var answer = answersByQuestionId[question.Id];
                var correctOptionId = question.Options.Single(option => option.IsCorrect).Id;

                return new TrialAttemptAnswerDto(
                    question.Id,
                    question.Text,
                    answer.SelectedOptionId,
                    correctOptionId,
                    answer.IsCorrect,
                    question.Explanation);
            })
            .ToList();

        return new TrialAttemptDetailDto(
            attempt.Id,
            attempt.TrialExamId!.Value,
            attempt.TrialExam != null ? attempt.TrialExam.Title : "Deneme",
            attempt.CorrectCount,
            attempt.WrongCount,
            attempt.TotalQuestions,
            attempt.TotalQuestions == 0 ? 0 : Math.Round((decimal)attempt.CorrectCount / attempt.TotalQuestions * 100, 1),
            attempt.TrialExam?.DurationMinutes,
            (int)Math.Max(1, Math.Round((attempt.FinishedAt.Value - attempt.StartedAt).TotalMinutes)),
            attempt.StartedAt,
            attempt.FinishedAt,
            details);
    }

    public async Task<StudentContinueTrialDto?> GetActiveTrial(string userId)
    {
        var attempt = await context.QuizAttempts
            .AsNoTracking()
            .Include(x => x.TrialExam)
            .Where(x => x.UserId == userId && x.Mode == QuizMode.TrialExam && !x.FinishedAt.HasValue)
            .OrderByDescending(x => x.StartedAt)
            .FirstOrDefaultAsync();

        if (attempt is null || attempt.TrialExam is null)
        {
            return null;
        }

        var expiresAt = attempt.StartedAt.AddMinutes(attempt.TrialExam.DurationMinutes);

        if (DateTime.UtcNow > expiresAt)
        {
            return null;
        }

        return new StudentContinueTrialDto(
            attempt.Id,
            attempt.TrialExamId!.Value,
            attempt.TrialExam.Title,
            attempt.TotalQuestions,
            attempt.TrialExam.DurationMinutes,
            attempt.StartedAt,
            expiresAt);
    }

    private static AnalyticsTopicStrengthDto ToTopicStrength(StudyProgress progress)
    {
        var total = progress.CorrectCount + progress.WrongCount;
        var successRate = total == 0 ? 0 : Math.Round((decimal)progress.CorrectCount / total * 100, 1);

        return new AnalyticsTopicStrengthDto(
            progress.TopicId,
            progress.Topic!.CourseId,
            progress.Topic.Course!.Name,
            progress.Topic.Title,
            progress.Status,
            progress.CorrectCount,
            progress.WrongCount,
            successRate,
            progress.LastStudiedAt);
    }
}
