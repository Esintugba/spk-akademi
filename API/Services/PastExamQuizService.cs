using API.Dtos;
using API.Entities;

namespace API.Services;

public enum PastExamQuizStartError
{
    None,
    Forbidden,
    InvalidTopics,
    NotEnoughQuestions,
    DemoQuestionLimitReached
}

public sealed class PastExamQuizStartOutcome
{
    public PastExamQuizStartError Error { get; init; }

    public PastExamQuizStartResponseDto? Response { get; init; }

    public int AvailableQuestionCount { get; init; }

    public static PastExamQuizStartOutcome Success(PastExamQuizStartResponseDto response) =>
        new() { Error = PastExamQuizStartError.None, Response = response };

    public static PastExamQuizStartOutcome Fail(PastExamQuizStartError error, int available = 0) =>
        new() { Error = error, AvailableQuestionCount = available };
}

public interface IPastExamQuizService
{
    Task<PastExamQuizStartOutcome> StartAsync(
        string studentId,
        StartPastExamQuizRequestDto request,
        CancellationToken cancellationToken = default);
}

public class PastExamQuizService(
    IQuizGenerationService quizGenerationService,
    IPastExamStrategy pastExamStrategy,
    IDemoAccessService demoAccessService) : IPastExamQuizService
{
    private const int SecondsPerQuestion = QuizGenerationService.SecondsPerQuestion;

    public async Task<PastExamQuizStartOutcome> StartAsync(
        string studentId,
        StartPastExamQuizRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var questionCount = Math.Clamp(request.QuestionCount, 5, 100);

        if (!await demoAccessService.CanUseQuestionQuotaAsync(studentId, questionCount, cancellationToken))
        {
            return PastExamQuizStartOutcome.Fail(PastExamQuizStartError.DemoQuestionLimitReached);
        }

        var selection = await pastExamStrategy.SelectQuestionsAsync(
            studentId,
            request,
            questionCount,
            cancellationToken);
        if (selection.InvalidTopics)
        {
            return PastExamQuizStartOutcome.Fail(PastExamQuizStartError.InvalidTopics);
        }

        if (selection.AvailableQuestionCount < 5 || selection.Questions.Count < 5)
        {
            return PastExamQuizStartOutcome.Fail(
                PastExamQuizStartError.NotEnoughQuestions,
                selection.AvailableQuestionCount);
        }

        var filterSnapshot = new
        {
            request.ExamTypes,
            request.Years,
            questionCount = selection.Questions.Count,
            request.OnlyPastExamQuestions,
            request.TopicIds,
            request.Session,
            request.Difficulty,
            request.MixedYears
        };

        var attempt = await quizGenerationService.CreateAttemptAsync(
            new QuizGenerationRequest
            {
                UserId = studentId,
                Mode = QuizMode.PastExams,
                Questions = selection.Questions,
                GeneratedFromPastExams = true,
                PastExamFilters = filterSnapshot
            },
            cancellationToken);

        return PastExamQuizStartOutcome.Success(new PastExamQuizStartResponseDto(
            attempt.Id,
            QuizMode.PastExams,
            selection.Questions.Count,
            attempt.StartedAt,
            selection.Questions.Count * SecondsPerQuestion));
    }
}

