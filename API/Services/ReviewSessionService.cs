using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IReviewSessionService
{
    Task<TodayReviewDto> GetTodayAsync(string studentId, CancellationToken cancellationToken = default);

    Task<ReviewSessionResponseDto> StartSessionAsync(
        string studentId,
        StartReviewSessionRequestDto request,
        CancellationToken cancellationToken = default);

    Task<SubmitReviewSessionResultDto> SubmitSessionAsync(
        string studentId,
        SubmitReviewSessionDto request,
        CancellationToken cancellationToken = default);

    Task<ReviewStatsDto> GetStatsAsync(string studentId, CancellationToken cancellationToken = default);

    Task SyncFromQuizAnswersAsync(
        string studentId,
        IReadOnlyList<QuizAnswerSyncItem> answers,
        CancellationToken cancellationToken = default);
}

public record QuizAnswerSyncItem(
    Guid QuestionId,
    bool IsCorrect,
    int? TimeSpentSeconds);

public class ReviewSessionService(
    DataContext context,
    IQuestionStudyProgressRepository progressRepository,
    IReviewSessionRepository sessionRepository,
    ISm2AlgorithmService sm2Algorithm) : IReviewSessionService
{
    private static readonly TimeSpan SessionTimeout = TimeSpan.FromHours(2);

    public async Task<TodayReviewDto> GetTodayAsync(string studentId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var items = await progressRepository.GetDueTodayAsync(studentId, now, cancellationToken);
        var summary = await BuildSummaryAsync(studentId, now, cancellationToken);

        return new TodayReviewDto(items, summary);
    }

    public async Task<ReviewSessionResponseDto> StartSessionAsync(
        string studentId,
        StartReviewSessionRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var maxQuestions = Math.Clamp(request.MaxQuestions, 1, 50);

        var dueItems = await progressRepository.GetDueTodayAsync(studentId, now, cancellationToken);
        if (dueItems.Count == 0)
        {
            throw new InvalidOperationException("Bugün tekrar edilecek soru bulunmuyor.");
        }

        var selected = SelectQuestionsForSession(dueItems, maxQuestions);
        var questionIds = selected.Select(x => x.QuestionId).ToList();

        var questions = await context.Questions
            .AsNoTracking()
            .Where(q => questionIds.Contains(q.Id) && !q.IsDeleted && q.ReviewStatus == ReviewStatus.Approved)
            .Include(q => q.Options)
            .Include(q => q.Topic)
            .ToListAsync(cancellationToken);

        var orderedQuestions = questionIds
            .Select((id, index) =>
            {
                var q = questions.First(x => x.Id == id);
                return new ReviewSessionQuestionDto(
                    q.Id,
                    index + 1,
                    q.Text,
                    selected.First(s => s.QuestionId == id).MasteryLevel,
                    q.Options
                        .OrderBy(o => o.Label)
                        .Select(o => new QuizQuestionOptionDto(o.Id, o.Label, o.Text))
                        .ToList());
            })
            .ToList();

        var session = new ReviewSession
        {
            StudentId = studentId,
            StartedAt = now,
            ExpiresAt = now.Add(SessionTimeout),
            QuestionCount = orderedQuestions.Count
        };

        sessionRepository.Add(session);
        await sessionRepository.SaveAsync(cancellationToken);

        return new ReviewSessionResponseDto(
            session.Id,
            session.StartedAt,
            session.ExpiresAt,
            session.QuestionCount,
            orderedQuestions);
    }

    public async Task<SubmitReviewSessionResultDto> SubmitSessionAsync(
        string studentId,
        SubmitReviewSessionDto request,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var session = await sessionRepository.GetWithAnswersAsync(request.SessionId, studentId, cancellationToken)
            ?? throw new KeyNotFoundException("Tekrar oturumu bulunamadı.");

        if (session.CompletedAt != null)
        {
            throw new InvalidOperationException("Bu oturum zaten tamamlanmış.");
        }

        if (session.ExpiresAt < now)
        {
            throw new InvalidOperationException("Tekrar oturumu süresi doldu. Lütfen yeni bir oturum başlatın.");
        }

        if (request.Answers.Count == 0)
        {
            throw new InvalidOperationException("En az bir cevap gönderilmelidir.");
        }

        var questionIds = request.Answers.Select(x => x.QuestionId).Distinct().ToList();
        var progresses = await progressRepository.GetByStudentAndQuestionsAsync(studentId, questionIds, cancellationToken);
        var progressMap = progresses.ToDictionary(x => x.QuestionId);

        var sessionAnswers = new List<ReviewSessionAnswer>();
        var results = new List<ReviewAnswerResultDto>();
        var correctCount = 0;
        var qualitySum = 0;

        foreach (var answer in request.Answers)
        {
            if (answer.Quality is < 0 or > 5)
            {
                throw new ArgumentOutOfRangeException(nameof(answer.Quality), "Kalite puanı 0-5 arasında olmalıdır.");
            }

            if (await sessionRepository.HasAnswerForQuestionAsync(session.Id, answer.QuestionId, cancellationToken))
            {
                throw new InvalidOperationException($"Soru zaten bu oturumda cevaplanmış: {answer.QuestionId}");
            }

            var answeredCorrect = answer.AnsweredCorrect ?? answer.Quality >= 3;
            if (answeredCorrect)
            {
                correctCount++;
            }

            qualitySum += answer.Quality;

            if (!progressMap.TryGetValue(answer.QuestionId, out var progress))
            {
                progress = Sm2AlgorithmService.CreateInitial(studentId, answer.QuestionId, now);
                progressRepository.Add(progress);
                progressMap[answer.QuestionId] = progress;
            }

            var calc = sm2Algorithm.ApplyReview(
                progress,
                answer.Quality,
                answeredCorrect,
                answer.ResponseTimeSeconds,
                now);

            sessionAnswers.Add(new ReviewSessionAnswer
            {
                ReviewSessionId = session.Id,
                QuestionId = answer.QuestionId,
                Quality = answer.Quality,
                AnsweredCorrect = answeredCorrect,
                ResponseTimeSeconds = answer.ResponseTimeSeconds,
                ReviewedAt = now
            });

            results.Add(new ReviewAnswerResultDto(
                answer.QuestionId,
                answer.Quality,
                calc.IntervalDays,
                calc.NextReviewAt,
                calc.MasteryLevel));
        }

        sessionRepository.AddAnswers(sessionAnswers);
        session.CorrectCount = correctCount;
        session.AverageQuality = Math.Round((decimal)qualitySum / request.Answers.Count, 2);
        session.CompletedAt = now;
        session.UpdatedAt = now;

        await sessionRepository.SaveAsync(cancellationToken);

        var retention = session.QuestionCount == 0
            ? 0
            : Math.Round((decimal)correctCount / session.QuestionCount * 100, 1);

        return new SubmitReviewSessionResultDto(
            session.Id,
            session.QuestionCount,
            correctCount,
            session.AverageQuality,
            retention,
            results,
            Array.Empty<UnlockedBadgeDto>());
    }

    public async Task<ReviewStatsDto> GetStatsAsync(string studentId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var dueToday = await progressRepository.CountDueTodayAsync(studentId, now, cancellationToken);
        var mastered = await progressRepository.CountMasteredAsync(studentId, cancellationToken);
        var tracked = await progressRepository.CountTrackedAsync(studentId, cancellationToken);
        var streak = await sessionRepository.CountCompletedDaysStreakAsync(studentId, cancellationToken);
        var retention = await sessionRepository.GetRetentionRateAsync(studentId, cancellationToken);
        var trend = await progressRepository.GetDailyTrendAsync(studentId, 14, cancellationToken);
        var mastery = await progressRepository.GetMasteryDistributionAsync(studentId, cancellationToken);
        var weakTopics = await progressRepository.GetWeakTopicsAsync(studentId, now, 8, cancellationToken);

        var progresses = await context.QuestionStudyProgresses
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .Select(x => x.CorrectRate)
            .ToListAsync(cancellationToken);

        var avgSuccess = progresses.Count == 0
            ? 0
            : Math.Round(progresses.Average(), 1);

        return new ReviewStatsDto(
            dueToday,
            mastered,
            tracked,
            streak,
            avgSuccess,
            retention,
            trend,
            mastery,
            weakTopics);
    }

    public async Task SyncFromQuizAnswersAsync(
        string studentId,
        IReadOnlyList<QuizAnswerSyncItem> answers,
        CancellationToken cancellationToken = default)
    {
        if (answers.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var questionIds = answers.Select(x => x.QuestionId).Distinct().ToList();
        var existing = await progressRepository.GetByStudentAndQuestionsAsync(studentId, questionIds, cancellationToken);
        var map = existing.ToDictionary(x => x.QuestionId);
        var toAdd = new List<QuestionStudyProgress>();

        foreach (var answer in answers)
        {
            if (!map.TryGetValue(answer.QuestionId, out var progress))
            {
                progress = Sm2AlgorithmService.CreateInitial(studentId, answer.QuestionId, now);
                toAdd.Add(progress);
                map[answer.QuestionId] = progress;
            }

            var quality = sm2Algorithm.QualityFromAnswer(answer.IsCorrect);
            sm2Algorithm.ApplyReview(progress, quality, answer.IsCorrect, answer.TimeSpentSeconds, now);
        }

        if (toAdd.Count > 0)
        {
            progressRepository.AddRange(toAdd);
        }

        await progressRepository.BulkSaveAsync(cancellationToken);
    }

    private static List<TodayReviewItemDto> SelectQuestionsForSession(
        IReadOnlyList<TodayReviewItemDto> dueItems,
        int maxQuestions)
    {
        var selected = new List<TodayReviewItemDto>();
        var lastTopicId = Guid.Empty;

        foreach (var item in dueItems.OrderBy(x => x.MasteryLevel).ThenBy(x => x.NextReviewAt))
        {
            if (selected.Count >= maxQuestions)
            {
                break;
            }

            if (selected.Count > 0 && item.TopicId == lastTopicId && dueItems.Count(x => x.TopicId != lastTopicId) > 0)
            {
                continue;
            }

            selected.Add(item);
            lastTopicId = item.TopicId;
        }

        if (selected.Count < maxQuestions)
        {
            foreach (var item in dueItems.Where(x => !selected.Any(s => s.QuestionId == x.QuestionId)).Take(maxQuestions - selected.Count))
            {
                selected.Add(item);
            }
        }

        return selected.OrderBy(_ => Random.Shared.Next()).ToList();
    }

    private async Task<TodayReviewSummaryDto> BuildSummaryAsync(
        string studentId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var dueToday = await progressRepository.CountDueTodayAsync(studentId, now, cancellationToken);
        var mastered = await progressRepository.CountMasteredAsync(studentId, cancellationToken);
        var streak = await sessionRepository.CountCompletedDaysStreakAsync(studentId, cancellationToken);

        var avgSuccess = await context.QuestionStudyProgresses
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .Select(x => (decimal?)x.CorrectRate)
            .AverageAsync(cancellationToken);

        return new TodayReviewSummaryDto(
            dueToday,
            mastered,
            streak,
            Math.Round(avgSuccess ?? 0, 1));
    }
}
