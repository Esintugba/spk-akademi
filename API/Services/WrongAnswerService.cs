using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum WrongAnswerStartError
{
    None,
    NotEnoughQuestions,
    NoAccessibleQuestions,
    DemoQuestionLimitReached
}

public sealed class WrongAnswerStartOutcome
{
    public WrongAnswerStartError Error { get; init; }

    public WrongAnswersQuizStartResponseDto? Response { get; init; }

    public int AvailableDueCount { get; init; }

    public static WrongAnswerStartOutcome Success(WrongAnswersQuizStartResponseDto response) =>
        new() { Error = WrongAnswerStartError.None, Response = response };

    public static WrongAnswerStartOutcome Fail(WrongAnswerStartError error, int availableDueCount = 0) =>
        new() { Error = error, AvailableDueCount = availableDueCount };
}

public interface IWrongAnswerService
{
    Task<WrongAnswerStartOutcome> StartQuizAsync(
        string studentId,
        StartWrongAnswersQuizRequestDto request,
        CancellationToken cancellationToken = default);

    Task<WrongAnswerQueuePageDto> GetQueueAsync(
        string studentId,
        int page,
        int pageSize,
        bool dueOnly,
        Guid? courseId,
        Guid? topicId,
        QuestionDifficulty? difficulty,
        CancellationToken cancellationToken = default);

    Task<WrongAnswerStatsDto> GetStatsAsync(string studentId, CancellationToken cancellationToken = default);

    Task<bool> RemoveFromQueueAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task RecordWrongAnswerAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task ProcessReviewResultsAsync(
        string studentId,
        Guid attemptId,
        IReadOnlyList<(Guid QuestionId, bool IsCorrect, int? ResponseTimeSeconds)> results,
        CancellationToken cancellationToken = default);
}

public class WrongAnswerService(
    DataContext context,
    IWrongAnswerQueueRepository queueRepository,
    IWrongAnswerReviewHistoryRepository historyRepository,
    ISpacedRepetitionService spacedRepetition,
    ILicenseAccessService licenseAccessService,
    IQuizGenerationService quizGenerationService,
    IWrongAnswersStrategy wrongAnswersStrategy,
    IDemoAccessService demoAccessService) : IWrongAnswerService
{
    private const int SecondsPerQuestion = QuizGenerationService.SecondsPerQuestion;
    private const int MinQuestionCount = QuizGenerationService.MinGeneratedQuestionCount;
    private const int MaxQuestionCount = QuizGenerationService.MaxGeneratedQuestionCount;

    public async Task<WrongAnswerStartOutcome> StartQuizAsync(
        string studentId,
        StartWrongAnswersQuizRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await EnsureHistoricalSyncAsync(studentId, cancellationToken);

        var questionCount = Math.Clamp(request.QuestionCount, MinQuestionCount, MaxQuestionCount);
        if (!await demoAccessService.CanUseQuestionQuotaAsync(studentId, questionCount, cancellationToken))
        {
            return WrongAnswerStartOutcome.Fail(WrongAnswerStartError.DemoQuestionLimitReached);
        }

        var now = DateTime.UtcNow;

        var selection = await wrongAnswersStrategy.SelectQuestionsAsync(
            studentId,
            request,
            questionCount,
            now,
            cancellationToken);
        if (selection.AvailableQuestionCount < MinQuestionCount)
        {
            return WrongAnswerStartOutcome.Fail(
                WrongAnswerStartError.NotEnoughQuestions,
                selection.AvailableQuestionCount);
        }

        var attempt = await quizGenerationService.CreateAttemptAsync(
            new QuizGenerationRequest
            {
                UserId = studentId,
                Mode = QuizMode.WrongAnswers,
                Questions = selection.Questions,
                GeneratedFromWrongAnswers = true
            },
            cancellationToken);

        return WrongAnswerStartOutcome.Success(new WrongAnswersQuizStartResponseDto(
            attempt.Id,
            QuizMode.WrongAnswers,
            selection.Questions.Count,
            attempt.StartedAt,
            selection.Questions.Count * SecondsPerQuestion));
    }

    public async Task<WrongAnswerQueuePageDto> GetQueueAsync(
        string studentId,
        int page,
        int pageSize,
        bool dueOnly,
        Guid? courseId,
        Guid? topicId,
        QuestionDifficulty? difficulty,
        CancellationToken cancellationToken = default)
    {
        await EnsureHistoricalSyncAsync(studentId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var (items, totalCount) = await queueRepository.GetPagedAsync(
            studentId,
            page,
            pageSize,
            dueOnly,
            courseId,
            topicId,
            difficulty,
            cancellationToken);

        var historyStats = await GetQuestionSuccessRatesAsync(studentId, items.Select(x => x.QuestionId).ToList(), cancellationToken);

        var dtos = items.Select(item =>
        {
            historyStats.TryGetValue(item.QuestionId, out var rate);
            return MapQueueItem(item, rate);
        }).ToList();

        return new WrongAnswerQueuePageDto(
            dtos,
            page,
            pageSize,
            totalCount,
            page * pageSize < totalCount);
    }

    public async Task<WrongAnswerStatsDto> GetStatsAsync(string studentId, CancellationToken cancellationToken = default)
    {
        await EnsureHistoricalSyncAsync(studentId, cancellationToken);

        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = now.AddDays(-7);

        var aggregate = await queueRepository.GetStatsAggregateAsync(studentId, now, cancellationToken);
        var todaySolved = await historyRepository.CountTodayCorrectAsync(studentId, todayStart, cancellationToken);
        var (correct, total) = await historyRepository.GetWeeklyAccuracyAsync(studentId, weekStart, cancellationToken);
        var weeklyAccuracy = total == 0 ? 0 : Math.Round((decimal)correct / total * 100, 1);

        var weakTopics = await historyRepository.GetWeakTopicsAsync(studentId, 5, cancellationToken);
        var weakTopicDtos = weakTopics
            .Select(x => new WeakTopicInsightDto(
                x.TopicId,
                x.TopicTitle,
                x.CourseName,
                x.WrongCount,
                x.TotalReviews == 0 ? 0 : Math.Round((decimal)x.CorrectCount / x.TotalReviews * 100, 1)))
            .ToList();

        return new WrongAnswerStatsDto(
            aggregate.TotalWrongQuestions,
            aggregate.DueForReview,
            aggregate.MasteredQuestions,
            todaySolved,
            weeklyAccuracy,
            weakTopicDtos);
    }

    public async Task<bool> RemoveFromQueueAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default)
    {
        var removed = await queueRepository.RemoveAsync(studentId, questionId, cancellationToken);
        if (removed)
        {
            await queueRepository.SaveChangesAsync(cancellationToken);
        }

        return removed;
    }

    public async Task RecordWrongAnswerAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var existing = await queueRepository.GetByStudentAndQuestionAsync(studentId, questionId, cancellationToken);

        if (existing is null)
        {
            await queueRepository.AddAsync(new WrongAnswerQueue
            {
                StudentId = studentId,
                QuestionId = questionId,
                WrongCount = 1,
                ReviewCount = 0,
                LastWrongAt = now,
                NextReviewAt = spacedRepetition.CalculateNextReviewAt(0, now),
                IsMastered = false
            }, cancellationToken);
        }
        else
        {
            existing.WrongCount += 1;
            existing.LastWrongAt = now;
            existing.IsMastered = false;
            existing.NextReviewAt = spacedRepetition.CalculateNextReviewAt(0, now);
            existing.UpdatedAt = now;
            await queueRepository.UpdateAsync(existing, cancellationToken);
        }

        await queueRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task ProcessReviewResultsAsync(
        string studentId,
        Guid attemptId,
        IReadOnlyList<(Guid QuestionId, bool IsCorrect, int? ResponseTimeSeconds)> results,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var histories = new List<WrongAnswerReviewHistory>();
        var queueUpdates = new List<WrongAnswerQueue>();

        foreach (var (questionId, isCorrect, responseTime) in results)
        {
            histories.Add(new WrongAnswerReviewHistory
            {
                StudentId = studentId,
                QuestionId = questionId,
                QuizAttemptId = attemptId,
                AnsweredCorrect = isCorrect,
                ReviewedAt = now,
                ResponseTimeSeconds = responseTime
            });

            var queueItem = await queueRepository.GetByStudentAndQuestionAsync(studentId, questionId, cancellationToken);
            if (queueItem is null && !isCorrect)
            {
                await RecordWrongAnswerAsync(studentId, questionId, cancellationToken);
                continue;
            }

            if (queueItem is null)
            {
                continue;
            }

            if (isCorrect)
            {
                queueItem.ReviewCount += 1;
                queueItem.LastReviewedAt = now;
                queueItem.NextReviewAt = spacedRepetition.CalculateNextReviewAt(queueItem.ReviewCount, now);
                queueItem.IsMastered = spacedRepetition.ShouldMarkMastered(queueItem.ReviewCount, true);
            }
            else
            {
                queueItem.WrongCount += 1;
                queueItem.LastWrongAt = now;
                queueItem.IsMastered = false;
                queueItem.ReviewCount = 0;
                queueItem.NextReviewAt = spacedRepetition.CalculateNextReviewAt(0, now);
            }

            queueItem.UpdatedAt = now;
            queueUpdates.Add(queueItem);
        }

        if (histories.Count > 0)
        {
            await historyRepository.AddRangeAsync(histories, cancellationToken);
        }

        if (queueUpdates.Count > 0)
        {
            await queueRepository.UpdateRangeAsync(queueUpdates, cancellationToken);
        }

        await historyRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureHistoricalSyncAsync(string studentId, CancellationToken cancellationToken)
    {
        var hasQueue = await context.WrongAnswerQueues
            .AnyAsync(x => x.StudentId == studentId, cancellationToken);

        if (hasQueue)
        {
            return;
        }

        var accessibleLicenseIds = (await licenseAccessService.GetAccessibleLicenseIds(studentId)).ToHashSet();
        var now = DateTime.UtcNow;

        var wrongAnswers = await context.QuizAnswers
            .AsNoTracking()
            .Include(x => x.Question)
                .ThenInclude(x => x!.Topic)
                    .ThenInclude(x => x!.Course)
            .Where(x =>
                x.QuizAttempt != null &&
                x.QuizAttempt.UserId == studentId &&
                !x.IsCorrect &&
                x.Question != null &&
                !x.Question.IsDeleted &&
                x.Question.ReviewStatus == ReviewStatus.Approved)
            .GroupBy(x => x.QuestionId)
            .Select(g => new
            {
                QuestionId = g.Key,
                LastWrongAt = g.Max(x => x.AnsweredAt),
                WrongCount = g.Count()
            })
            .ToListAsync(cancellationToken);

        var newItems = new List<WrongAnswerQueue>();

        foreach (var wrong in wrongAnswers)
        {
            var question = await context.Questions
                .AsNoTracking()
                .Include(x => x.Topic)
                    .ThenInclude(x => x!.Course)
                .FirstOrDefaultAsync(x => x.Id == wrong.QuestionId, cancellationToken);

            if (question?.Topic?.Course is null ||
                !accessibleLicenseIds.Contains(question.Topic.Course.LicenseId))
            {
                continue;
            }

            newItems.Add(new WrongAnswerQueue
            {
                StudentId = studentId,
                QuestionId = wrong.QuestionId,
                WrongCount = wrong.WrongCount,
                ReviewCount = 0,
                LastWrongAt = wrong.LastWrongAt,
                NextReviewAt = spacedRepetition.CalculateNextReviewAt(0, wrong.LastWrongAt),
                IsMastered = false
            });
        }

        if (newItems.Count > 0)
        {
            await queueRepository.AddRangeAsync(newItems, cancellationToken);
            await queueRepository.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<Dictionary<Guid, decimal>> GetQuestionSuccessRatesAsync(
        string studentId,
        IReadOnlyList<Guid> questionIds,
        CancellationToken cancellationToken)
    {
        if (questionIds.Count == 0)
        {
            return new Dictionary<Guid, decimal>();
        }

        var stats = await context.WrongAnswerReviewHistories
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && questionIds.Contains(x.QuestionId))
            .GroupBy(x => x.QuestionId)
            .Select(g => new
            {
                QuestionId = g.Key,
                Total = g.Count(),
                Correct = g.Count(x => x.AnsweredCorrect)
            })
            .ToListAsync(cancellationToken);

        return stats.ToDictionary(
            x => x.QuestionId,
            x => x.Total == 0 ? 0 : Math.Round((decimal)x.Correct / x.Total * 100, 1));
    }

    private static WrongAnswerQueueItemDto MapQueueItem(WrongAnswerQueue item, decimal successRate)
    {
        var question = item.Question!;
        var topic = question.Topic!;
        var course = topic.Course!;

        return new WrongAnswerQueueItemDto(
            item.QuestionId,
            question.Text.Length > 120 ? question.Text[..120] + "…" : question.Text,
            topic.Id,
            topic.Title,
            course.Id,
            course.Name,
            question.Difficulty,
            item.WrongCount,
            item.ReviewCount,
            item.LastWrongAt,
            item.NextReviewAt,
            item.LastReviewedAt,
            item.IsMastered,
            successRate);
    }

}
