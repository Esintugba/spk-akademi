using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IQuizCatalogService
{
    Task<QuizCatalogResponseDto> GetCatalogAsync(
        string userId,
        QuizCatalogQueryDto query,
        CancellationToken cancellationToken = default);

    Task<QuizCatalogResponseDto> GetLicenseCatalogAsync(
        string userId,
        Guid licenseId,
        QuizCatalogQueryDto query,
        CancellationToken cancellationToken = default);

    Task<QuizOverviewDto?> GetOverviewAsync(
        string userId,
        Guid quizId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FeaturedQuizDto>> GetFeaturedAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuizAnalyticsDto>> GetAnalyticsAsync(
        string userId,
        CancellationToken cancellationToken = default);
}

public class QuizCatalogService(
    IQuizRepository quizRepository,
    ITrialExamRepository trialExamRepository,
    IStudentLicenseRepository studentLicenseRepository) : IQuizCatalogService
{
    public Task<QuizCatalogResponseDto> GetCatalogAsync(
        string userId,
        QuizCatalogQueryDto query,
        CancellationToken cancellationToken = default) =>
        GetCatalogInternalAsync(userId, query, cancellationToken);

    public Task<QuizCatalogResponseDto> GetLicenseCatalogAsync(
        string userId,
        Guid licenseId,
        QuizCatalogQueryDto query,
        CancellationToken cancellationToken = default) =>
        GetCatalogInternalAsync(userId, query with { LicenseId = licenseId }, cancellationToken);

    public async Task<QuizOverviewDto?> GetOverviewAsync(
        string userId,
        Guid quizId,
        CancellationToken cancellationToken = default)
    {
        var access = await GetAccessContextAsync(userId, cancellationToken);
        var quiz = await quizRepository.GetPublishedQuizAsync(
            quizId,
            access.AccessibleLicenseIds,
            access.PurchasedQuizIds,
            cancellationToken);

        if (quiz is null)
        {
            return null;
        }

        var stats = (await quizRepository.GetStatsAsync([quiz.Id], cancellationToken))
            .FirstOrDefault(x => x.QuizId == quiz.Id);
        var progress = (await quizRepository.GetLatestAttemptsAsync(userId, [quiz.Id], cancellationToken))
            .FirstOrDefault(x => x.TrialExamId == quiz.Id);

        var distribution = quiz.Questions
            .Where(x => x.Question?.Topic?.Course is not null)
            .GroupBy(x => new
            {
                CourseId = x.Question!.Topic!.Course!.Id,
                CourseName = x.Question.Topic.Course.Name,
                TopicId = x.Question.Topic.Id,
                TopicTitle = x.Question.Topic.Title
            })
            .Select(x => new QuizQuestionDistributionDto(
                x.Key.CourseId,
                x.Key.CourseName,
                x.Key.TopicId,
                x.Key.TopicTitle,
                x.Count()))
            .OrderByDescending(x => x.QuestionCount)
            .ToList();

        return new QuizOverviewDto(
            quiz.Id,
            quiz.Title,
            quiz.Slug,
            quiz.Description,
            quiz.License?.Name,
            quiz.LicenseId,
            quiz.QuestionCount,
            quiz.DurationMinutes * 60,
            quiz.DifficultyLevel,
            stats?.AttemptCount ?? 0,
            Round(stats?.AverageScore ?? 0),
            Rate(stats?.CompletedCount ?? 0, stats?.AttemptCount ?? 0),
            Rate(stats?.AbandonedCount ?? 0, stats?.AttemptCount ?? 0),
            quiz.IsFree,
            true,
            quiz.IsFeatured,
            SplitTags(quiz.Tags),
            distribution,
            ToProgress(progress));
    }

    public async Task<IReadOnlyList<FeaturedQuizDto>> GetFeaturedAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var access = await GetAccessContextAsync(userId, cancellationToken);
        var quizzes = await quizRepository.QueryPublishedQuizzes(access.AccessibleLicenseIds, access.PurchasedQuizIds)
            .Where(x => x.IsFeatured)
            .OrderByDescending(x => x.PopularityScore)
            .ThenByDescending(x => x.CreatedAt)
            .Take(12)
            .ToListAsync(cancellationToken);

        var quizIds = quizzes.Select(x => x.Id).ToList();
        var stats = (await quizRepository.GetStatsAsync(quizIds, cancellationToken)).ToDictionary(x => x.QuizId);

        return quizzes.Select(x =>
        {
            stats.TryGetValue(x.Id, out var quizStats);
            return new FeaturedQuizDto(
                x.Id,
                x.Title,
                x.License?.Name,
                x.QuestionCount,
                x.DurationMinutes * 60,
                x.DifficultyLevel,
                x.PopularityScore,
                Round(quizStats?.AverageScore ?? 0),
                x.IsFree,
                true);
        }).ToList();
    }

    public async Task<IReadOnlyList<QuizAnalyticsDto>> GetAnalyticsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var access = await GetAccessContextAsync(userId, cancellationToken);
        var quizzes = await quizRepository.QueryPublishedQuizzes(access.AccessibleLicenseIds, access.PurchasedQuizIds)
            .OrderByDescending(x => x.PopularityScore)
            .Take(50)
            .Select(x => new { x.Id, x.Title })
            .ToListAsync(cancellationToken);

        var stats = (await quizRepository.GetStatsAsync(quizzes.Select(x => x.Id).ToList(), cancellationToken))
            .ToDictionary(x => x.QuizId);

        return quizzes.Select(x =>
        {
            stats.TryGetValue(x.Id, out var quizStats);
            return new QuizAnalyticsDto(
                x.Id,
                x.Title,
                quizStats?.AttemptCount ?? 0,
                Rate(quizStats?.CompletedCount ?? 0, quizStats?.AttemptCount ?? 0),
                Rate(quizStats?.AbandonedCount ?? 0, quizStats?.AttemptCount ?? 0),
                Round(quizStats?.AverageScore ?? 0));
        }).ToList();
    }

    private async Task<QuizCatalogResponseDto> GetCatalogInternalAsync(
        string userId,
        QuizCatalogQueryDto query,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        var access = await GetAccessContextAsync(userId, cancellationToken);

        var quizzes = quizRepository.QueryPublishedQuizzes(access.AccessibleLicenseIds, access.PurchasedQuizIds);
        quizzes = ApplyFilters(quizzes, query);
        quizzes = ApplySort(quizzes, query.SortBy);

        var totalCount = await quizzes.CountAsync(cancellationToken);
        var pageItems = await quizzes
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var quizIds = pageItems.Select(x => x.Id).ToList();
        var attempts = (await quizRepository.GetLatestAttemptsAsync(userId, quizIds, cancellationToken))
            .Where(x => x.TrialExamId.HasValue)
            .ToDictionary(x => x.TrialExamId!.Value);
        var stats = (await quizRepository.GetStatsAsync(quizIds, cancellationToken)).ToDictionary(x => x.QuizId);

        var filteredItems = pageItems
            .Where(x => MatchesStatus(query.Status, attempts.GetValueOrDefault(x.Id)))
            .Select(x =>
            {
                attempts.TryGetValue(x.Id, out var progress);
                stats.TryGetValue(x.Id, out var quizStats);
                return ToCatalogItem(x, quizStats, progress);
            })
            .ToList();

        return new QuizCatalogResponseDto(
            filteredItems,
            page,
            pageSize,
            totalCount,
            page * pageSize < totalCount);
    }

    private async Task<(IReadOnlyList<Guid> AccessibleLicenseIds, IReadOnlyList<Guid> PurchasedQuizIds)> GetAccessContextAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var licenseIds = await studentLicenseRepository.GetActiveLicenseIdsAsync(userId, cancellationToken);
        var purchasedQuizIds = await trialExamRepository.GetPurchasedTrialIdsAsync(userId, cancellationToken);
        return (licenseIds, purchasedQuizIds);
    }

    private static IQueryable<TrialExam> ApplyFilters(IQueryable<TrialExam> query, QuizCatalogQueryDto filters)
    {
        if (filters.LicenseId.HasValue)
        {
            query = query.Where(x => x.LicenseId == filters.LicenseId.Value);
        }

        if (filters.CourseId.HasValue)
        {
            query = query.Where(x => x.Questions.Any(q => q.Question != null && q.Question.Topic!.CourseId == filters.CourseId.Value));
        }

        if (filters.TopicId.HasValue)
        {
            query = query.Where(x => x.Questions.Any(q => q.Question != null && q.Question.TopicId == filters.TopicId.Value));
        }

        if (filters.IsFree.HasValue)
        {
            query = query.Where(x => x.IsFree == filters.IsFree.Value);
        }

        if (TryParseDifficulty(filters.Difficulty, out var difficulty))
        {
            query = query.Where(x => x.DifficultyLevel == difficulty);
        }

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim();
            query = query.Where(x =>
                x.Title.Contains(search) ||
                x.Description.Contains(search) ||
                (x.Tags != null && x.Tags.Contains(search)));
        }

        return query;
    }

    private static IQueryable<TrialExam> ApplySort(IQueryable<TrialExam> query, string? sortBy) =>
        sortBy?.Trim().ToLowerInvariant() switch
        {
            "popular" => query.OrderByDescending(x => x.PopularityScore).ThenByDescending(x => x.CreatedAt),
            "shortest-duration" or "shortestduration" => query.OrderBy(x => x.DurationMinutes).ThenBy(x => x.Title),
            "highest-rated" or "highestrated" or "highest-success-rate" or "highestsuccessrate" =>
                query.OrderByDescending(x => x.PopularityScore).ThenByDescending(x => x.CreatedAt),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };

    private static QuizCatalogItemDto ToCatalogItem(
        TrialExam quiz,
        QuizAttemptStats? stats,
        QuizAttempt? progress) =>
        new(
            quiz.Id,
            quiz.Title,
            quiz.Slug,
            quiz.Description,
            quiz.License?.Name,
            quiz.LicenseId,
            quiz.QuestionCount,
            quiz.DurationMinutes * 60,
            quiz.DifficultyLevel,
            stats?.AttemptCount ?? 0,
            Round(stats?.AverageScore ?? 0),
            Rate(stats?.CompletedCount ?? 0, stats?.AttemptCount ?? 0),
            Rate(stats?.AbandonedCount ?? 0, stats?.AttemptCount ?? 0),
            quiz.IsFree,
            true,
            quiz.IsFeatured,
            SplitTags(quiz.Tags),
            ToProgress(progress));

    private static StudentQuizProgressDto ToProgress(QuizAttempt? attempt)
    {
        if (attempt is null)
        {
            return new StudentQuizProgressDto(false, false, null, null, null);
        }

        var completed = attempt.Status == QuizAttemptStatus.Completed || attempt.FinishedAt.HasValue;
        var score = completed && attempt.TotalQuestions > 0
            ? Round((decimal)attempt.CorrectCount / attempt.TotalQuestions * 100)
            : (decimal?)null;

        return new StudentQuizProgressDto(
            completed,
            !completed && attempt.Status is QuizAttemptStatus.Started or QuizAttemptStatus.InProgress,
            completed ? null : attempt.Id,
            score,
            attempt.StartedAt);
    }

    private static bool MatchesStatus(string? status, QuizAttempt? attempt)
    {
        return status?.Trim().ToLowerInvariant() switch
        {
            "completed" => attempt is not null && (attempt.Status == QuizAttemptStatus.Completed || attempt.FinishedAt.HasValue),
            "in-progress" or "inprogress" => attempt is not null && !attempt.FinishedAt.HasValue && attempt.Status is QuizAttemptStatus.Started or QuizAttemptStatus.InProgress,
            "available" or "incomplete" or "not-completed" or "notcompleted" => attempt is null || (!attempt.FinishedAt.HasValue && attempt.Status != QuizAttemptStatus.Completed),
            _ => true
        };
    }

    private static bool TryParseDifficulty(string? value, out QuestionDifficulty difficulty)
    {
        if (Enum.TryParse(value, true, out difficulty))
        {
            return true;
        }

        return int.TryParse(value, out var numeric) && Enum.IsDefined(typeof(QuestionDifficulty), numeric)
            ? (difficulty = (QuestionDifficulty)numeric) == (QuestionDifficulty)numeric
            : false;
    }

    private static IReadOnlyList<string> SplitTags(string? tags) =>
        string.IsNullOrWhiteSpace(tags)
            ? []
            : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static decimal Rate(int value, int total) =>
        total <= 0 ? 0 : Round((decimal)value / total * 100);

    private static decimal Round(decimal value) => Math.Round(value, 1);
}
