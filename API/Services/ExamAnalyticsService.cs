using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IExamAnalyticsService
{
    Task<PastExamAnalyticsDto> GetPastExamAnalyticsAsync(
        string studentId,
        CancellationToken cancellationToken = default);
}

public class ExamAnalyticsService(
    DataContext context,
    ILicenseAccessService licenseAccessService) : IExamAnalyticsService
{
    public async Task<PastExamAnalyticsDto> GetPastExamAnalyticsAsync(
        string studentId,
        CancellationToken cancellationToken = default)
    {
        var accessibleLicenseIds = (await licenseAccessService.GetAccessibleLicenseIds(studentId)).ToHashSet();

        var baseQuery = context.QuizAnswers
            .AsNoTracking()
            .Where(x =>
                x.QuizAttempt != null
                && x.QuizAttempt.UserId == studentId
                && x.Question != null
                && !x.Question.IsDeleted
                && x.Question.IsPastExamQuestion
                && x.Question.ReviewStatus == ReviewStatus.Approved
                && x.Question.Topic != null
                && x.Question.Topic.Course != null
                && accessibleLicenseIds.Contains(x.Question.Topic.Course.LicenseId))
            .Select(x => new
            {
                x.IsCorrect,
                x.Question!.ExamYear,
                x.Question.ExamType,
                TopicTitle = x.Question.Topic!.Title,
                x.Question.TopicId
            })
            .AsQueryable();

        var totals = await baseQuery
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Correct = g.Count(x => x.IsCorrect)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var totalSolved = totals?.Total ?? 0;
        var correctRate = totalSolved == 0
            ? 0
            : Math.Round((decimal)(totals?.Correct ?? 0) / totalSolved * 100, 1);

        var yearRates = await baseQuery
            .Where(x => x.ExamYear != null)
            .GroupBy(x => x.ExamYear!.Value)
            .Select(g => new
            {
                Year = g.Key,
                Total = g.Count(),
                Correct = g.Count(x => x.IsCorrect)
            })
            .ToListAsync(cancellationToken);

        var yearRatesComputed = yearRates
            .Where(x => x.Total > 0)
            .Select(x => new
            {
                x.Year,
                Rate = Math.Round((decimal)x.Correct / x.Total * 100, 1),
                x.Total
            })
            .ToList();

        var strongYears = yearRatesComputed
            .OrderByDescending(x => x.Rate)
            .ThenByDescending(x => x.Total)
            .Take(1)
            .Select(x => x.Year)
            .ToList();

        var weakYears = yearRatesComputed
            .OrderBy(x => x.Rate)
            .ThenByDescending(x => x.Total)
            .Take(1)
            .Select(x => x.Year)
            .ToList();

        var yearRateDtos = yearRatesComputed
            .OrderBy(x => x.Year)
            .Select(x => new PastExamYearRateDto(x.Year, x.Rate, x.Total))
            .ToList();

        var examTypeRates = await baseQuery
            .Where(x => x.ExamType != null)
            .GroupBy(x => x.ExamType!.Value)
            .Select(g => new
            {
                ExamType = g.Key,
                Total = g.Count(),
                Correct = g.Count(x => x.IsCorrect)
            })
            .ToListAsync(cancellationToken);

        var bestExamType = examTypeRates
            .Where(x => x.Total > 0)
            .Select(x => new
            {
                x.ExamType,
                Rate = Math.Round((decimal)x.Correct / x.Total * 100, 1),
                x.Total
            })
            .OrderByDescending(x => x.Rate)
            .ThenByDescending(x => x.Total)
            .Select(x => (ExamType?)x.ExamType)
            .FirstOrDefault();

        var examTypeRateDtos = examTypeRates
            .Where(x => x.Total > 0)
            .Select(x => new PastExamExamTypeRateDto(
                x.ExamType,
                Math.Round((decimal)x.Correct / x.Total * 100, 1),
                x.Total))
            .OrderByDescending(x => x.TotalSolved)
            .ToList();

        var worstTopic = await baseQuery
            .GroupBy(x => new { x.TopicId, x.TopicTitle })
            .Select(g => new
            {
                g.Key.TopicTitle,
                Total = g.Count(),
                Correct = g.Count(x => x.IsCorrect)
            })
            .Where(x => x.Total >= 5)
            .OrderBy(x => (decimal)x.Correct / x.Total)
            .ThenByDescending(x => x.Total)
            .Select(x => x.TopicTitle)
            .FirstOrDefaultAsync(cancellationToken);

        var weakTopics = await baseQuery
            .GroupBy(x => new { x.TopicId, x.TopicTitle })
            .Select(g => new
            {
                g.Key.TopicId,
                g.Key.TopicTitle,
                Total = g.Count(),
                Correct = g.Count(x => x.IsCorrect)
            })
            .Where(x => x.Total >= 5)
            .OrderBy(x => (decimal)x.Correct / x.Total)
            .ThenByDescending(x => x.Total)
            .Take(6)
            .Select(x => new PastExamWeakTopicRateDto(
                x.TopicId,
                x.TopicTitle,
                Math.Round((decimal)x.Correct / x.Total * 100, 1),
                x.Total))
            .ToListAsync(cancellationToken);

        return new PastExamAnalyticsDto(
            totalSolved,
            correctRate,
            strongYears,
            weakYears,
            bestExamType,
            worstTopic,
            yearRateDtos,
            examTypeRateDtos,
            weakTopics);
    }
}

