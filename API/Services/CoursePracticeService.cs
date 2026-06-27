using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum CoursePracticeStartError
{
    None,
    CourseNotFound,
    Forbidden,
    InvalidTopics,
    NotEnoughQuestions,
    DemoQuestionLimitReached
}

public sealed class CoursePracticeStartOutcome
{
    public CoursePracticeStartError Error { get; init; }

    public CoursePracticeQuizResponseDto? Response { get; init; }

    public int AvailableQuestionCount { get; init; }

    public static CoursePracticeStartOutcome Success(CoursePracticeQuizResponseDto response) =>
        new() { Error = CoursePracticeStartError.None, Response = response };

    public static CoursePracticeStartOutcome Fail(CoursePracticeStartError error, int available = 0) =>
        new() { Error = error, AvailableQuestionCount = available };
}

public interface ICoursePracticeService
{
    Task<IReadOnlyList<CoursePracticeCourseOptionDto>> GetCourseOptionsAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<CoursePracticeStartOutcome> StartPracticeAsync(
        string userId,
        StartCoursePracticeQuizRequestDto request,
        CancellationToken cancellationToken = default);
}

public class CoursePracticeService(
    DataContext context,
    ICoursePracticeRepository coursePracticeRepository,
    ILicenseAccessService licenseAccessService,
    IQuizGenerationService quizGenerationService,
    ICoursePracticeStrategy coursePracticeStrategy,
    IDemoAccessService demoAccessService) : ICoursePracticeService
{
    private const int MinQuestionCount = QuizGenerationService.MinGeneratedQuestionCount;
    private const int MaxQuestionCount = QuizGenerationService.MaxGeneratedQuestionCount;
    private const int SecondsPerQuestion = QuizGenerationService.SecondsPerQuestion;

    public async Task<IReadOnlyList<CoursePracticeCourseOptionDto>> GetCourseOptionsAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var licenseIds = await licenseAccessService.GetAccessibleLicenseIds(userId);
        var rows = await coursePracticeRepository.GetAccessibleCoursesAsync(userId, licenseIds, cancellationToken);

        return rows
            .Select(row =>
            {
                var total = row.CorrectCount + row.WrongCount;
                var successRate = total == 0 ? 0 : Math.Round((decimal)row.CorrectCount / total * 100, 1);
                var progress = row.TotalTopicCount == 0
                    ? 0
                    : Math.Round((decimal)row.StudiedTopicCount / row.TotalTopicCount * 100, 1);

                return new CoursePracticeCourseOptionDto(
                    row.CourseId,
                    row.LicenseId,
                    row.LicenseName,
                    row.CourseName,
                    row.TotalQuestionCount,
                    row.TopicCount,
                    successRate,
                    progress);
            })
            .ToList();
    }

    public async Task<CoursePracticeStartOutcome> StartPracticeAsync(
        string userId,
        StartCoursePracticeQuizRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var questionCount = Math.Clamp(request.QuestionCount, MinQuestionCount, MaxQuestionCount);

        if (!await demoAccessService.CanUseQuestionQuotaAsync(userId, questionCount, cancellationToken))
        {
            return CoursePracticeStartOutcome.Fail(CoursePracticeStartError.DemoQuestionLimitReached);
        }

        var course = await coursePracticeRepository.GetCourseAsync(request.CourseId, cancellationToken);
        if (course is null)
        {
            return CoursePracticeStartOutcome.Fail(CoursePracticeStartError.CourseNotFound);
        }

        if (!await licenseAccessService.CanAccessCourse(userId, request.CourseId))
        {
            return CoursePracticeStartOutcome.Fail(CoursePracticeStartError.Forbidden);
        }

        if (request.TopicIds is { Count: > 0 })
        {
            var validTopicIds = await context.Topics
                .AsNoTracking()
                .Where(x => x.CourseId == request.CourseId)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            if (request.TopicIds.Any(id => !validTopicIds.Contains(id)))
            {
                return CoursePracticeStartOutcome.Fail(CoursePracticeStartError.InvalidTopics);
            }
        }

        var selected = await coursePracticeStrategy.SelectQuestionsAsync(
            userId,
            request,
            questionCount,
            cancellationToken);
        if (selected.Count < MinQuestionCount)
        {
            return CoursePracticeStartOutcome.Fail(CoursePracticeStartError.NotEnoughQuestions, selected.Count);
        }
        var filterSnapshot = new CoursePracticeFilterSnapshot
        {
            CourseId = request.CourseId,
            QuestionCount = questionCount,
            DifficultyLevels = request.DifficultyLevels?.ToList() ?? [],
            TopicIds = request.TopicIds?.ToList() ?? [],
            IncludeWrongAnswered = request.IncludeWrongAnswered,
            RandomizeQuestions = request.RandomizeQuestions,
            RandomizeOptions = request.RandomizeOptions
        };

        var attempt = await quizGenerationService.CreateAttemptAsync(
            new QuizGenerationRequest
            {
                UserId = userId,
                Mode = QuizMode.CoursePractice,
                CourseId = request.CourseId,
                Questions = selected,
                GeneratedFilters = filterSnapshot
            },
            cancellationToken);

        return CoursePracticeStartOutcome.Success(new CoursePracticeQuizResponseDto(
            attempt.Id,
            QuizMode.CoursePractice,
            course.Id,
            course.Name,
            selected.Count,
            selected.Count * SecondsPerQuestion,
            attempt.StartedAt));
    }

}
