using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IQuestionStudyProgressRepository
{
    Task<QuestionStudyProgress?> GetByStudentAndQuestionAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<List<QuestionStudyProgress>> GetByStudentAndQuestionsAsync(
        string studentId,
        IEnumerable<Guid> questionIds,
        CancellationToken cancellationToken = default);

    Task<List<TodayReviewItemDto>> GetDueTodayAsync(
        string studentId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<int> CountDueTodayAsync(string studentId, DateTime asOfUtc, CancellationToken cancellationToken = default);

    Task<int> CountMasteredAsync(string studentId, CancellationToken cancellationToken = default);

    Task<int> CountTrackedAsync(string studentId, CancellationToken cancellationToken = default);

    Task<List<ReviewMasteryDistributionDto>> GetMasteryDistributionAsync(
        string studentId,
        CancellationToken cancellationToken = default);

    Task<List<ReviewWeakTopicDto>> GetWeakTopicsAsync(
        string studentId,
        DateTime asOfUtc,
        int take = 8,
        CancellationToken cancellationToken = default);

    Task<List<ReviewTrendPointDto>> GetDailyTrendAsync(
        string studentId,
        int days,
        CancellationToken cancellationToken = default);

    void Add(QuestionStudyProgress progress);

    void AddRange(IEnumerable<QuestionStudyProgress> progresses);

    Task BulkSaveAsync(CancellationToken cancellationToken = default);
}

public class QuestionStudyProgressRepository(DataContext context) : IQuestionStudyProgressRepository
{
    public Task<QuestionStudyProgress?> GetByStudentAndQuestionAsync(
        string studentId,
        Guid questionId,
        CancellationToken cancellationToken = default) =>
        context.QuestionStudyProgresses
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.QuestionId == questionId, cancellationToken);

    public Task<List<QuestionStudyProgress>> GetByStudentAndQuestionsAsync(
        string studentId,
        IEnumerable<Guid> questionIds,
        CancellationToken cancellationToken = default)
    {
        var ids = questionIds.Distinct().ToList();
        return context.QuestionStudyProgresses
            .Where(x => x.StudentId == studentId && ids.Contains(x.QuestionId))
            .ToListAsync(cancellationToken);
    }

    public Task<List<TodayReviewItemDto>> GetDueTodayAsync(
        string studentId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        context.QuestionStudyProgresses
            .AsNoTracking()
            .Where(x =>
                x.StudentId == studentId
                && x.NextReviewAt != null
                && x.NextReviewAt <= asOfUtc
                && x.Question != null
                && !x.Question.IsDeleted
                && x.Question.ReviewStatus == ReviewStatus.Approved)
            .OrderBy(x => x.MasteryLevel)
            .ThenBy(x => x.NextReviewAt)
            .Select(x => new TodayReviewItemDto(
                x.QuestionId,
                x.Question!.Text,
                x.Question.TopicId,
                x.Question.Topic!.Title,
                x.Question.Topic.Course!.Name,
                x.MasteryLevel,
                x.NextReviewAt,
                x.CorrectRate,
                x.IntervalDays,
                x.EaseFactor))
            .ToListAsync(cancellationToken);

    public Task<int> CountDueTodayAsync(string studentId, DateTime asOfUtc, CancellationToken cancellationToken = default) =>
        context.QuestionStudyProgresses
            .AsNoTracking()
            .CountAsync(x =>
                x.StudentId == studentId
                && x.NextReviewAt != null
                && x.NextReviewAt <= asOfUtc
                && x.Question != null
                && !x.Question.IsDeleted
                && x.Question.ReviewStatus == ReviewStatus.Approved,
                cancellationToken);

    public Task<int> CountMasteredAsync(string studentId, CancellationToken cancellationToken = default) =>
        context.QuestionStudyProgresses
            .AsNoTracking()
            .CountAsync(x => x.StudentId == studentId && x.MasteryLevel == MasteryLevel.Mastered, cancellationToken);

    public Task<int> CountTrackedAsync(string studentId, CancellationToken cancellationToken = default) =>
        context.QuestionStudyProgresses
            .AsNoTracking()
            .CountAsync(x => x.StudentId == studentId, cancellationToken);

    public Task<List<ReviewMasteryDistributionDto>> GetMasteryDistributionAsync(
        string studentId,
        CancellationToken cancellationToken = default) =>
        context.QuestionStudyProgresses
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .GroupBy(x => x.MasteryLevel)
            .Select(g => new ReviewMasteryDistributionDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

    public async Task<List<ReviewWeakTopicDto>> GetWeakTopicsAsync(
        string studentId,
        DateTime asOfUtc,
        int take = 8,
        CancellationToken cancellationToken = default)
    {
        var rows = await context.QuestionStudyProgresses
            .AsNoTracking()
            .Where(x =>
                x.StudentId == studentId
                && x.Question != null
                && !x.Question.IsDeleted
                && x.Question.ReviewStatus == ReviewStatus.Approved)
            .Select(x => new
            {
                x.Question!.TopicId,
                TopicTitle = x.Question.Topic!.Title,
                CourseName = x.Question.Topic.Course!.Name,
                x.NextReviewAt,
                x.CorrectRate
            })
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => new { x.TopicId, x.TopicTitle, x.CourseName })
            .Select(g => new ReviewWeakTopicDto(
                g.Key.TopicId,
                g.Key.TopicTitle,
                g.Key.CourseName,
                g.Count(x => x.NextReviewAt != null && x.NextReviewAt <= asOfUtc),
                g.Average(x => x.CorrectRate)))
            .OrderByDescending(x => x.DueCount)
            .ThenBy(x => x.SuccessRate)
            .Take(take)
            .ToList();
    }

    public async Task<List<ReviewTrendPointDto>> GetDailyTrendAsync(
        string studentId,
        int days,
        CancellationToken cancellationToken = default)
    {
        var from = DateTime.UtcNow.Date.AddDays(-days + 1);
        var rows = await context.ReviewSessionAnswers
            .AsNoTracking()
            .Where(x =>
                x.ReviewSession != null
                && x.ReviewSession.StudentId == studentId
                && x.ReviewedAt >= from)
            .Select(x => new { x.ReviewedAt, x.Quality })
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => x.ReviewedAt.Date)
            .Select(g =>
            {
                var count = g.Count();
                return new ReviewTrendPointDto(
                    g.Key.ToString("yyyy-MM-dd"),
                    count,
                    count == 0
                        ? 0
                        : Math.Round((decimal)g.Count(x => x.Quality >= 3) / count * 100, 1));
            })
            .OrderBy(x => x.Date)
            .ToList();
    }

    public void Add(QuestionStudyProgress progress) => context.QuestionStudyProgresses.Add(progress);

    public void AddRange(IEnumerable<QuestionStudyProgress> progresses) =>
        context.QuestionStudyProgresses.AddRange(progresses);

    public Task BulkSaveAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
