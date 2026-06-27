using System.Text.Json;
using API.Entities;
using API.Repositories;

namespace API.Services;

public sealed class QuizGenerationRequest
{
    public string UserId { get; init; } = string.Empty;

    public QuizMode Mode { get; init; }

    public IReadOnlyList<Question> Questions { get; init; } = [];

    public Guid? CourseId { get; init; }

    public Guid? TopicId { get; init; }

    public Guid? TrialExamId { get; init; }

    public object? GeneratedFilters { get; init; }

    public bool GeneratedFromPastExams { get; init; }

    public object? PastExamFilters { get; init; }

    public bool GeneratedFromWrongAnswers { get; init; }
}

public interface IQuizGenerationService
{
    Task<QuizAttempt> CreateAttemptAsync(
        QuizGenerationRequest request,
        CancellationToken cancellationToken = default);
}

public class QuizGenerationService(IQuizAttemptRepository attempts) : IQuizGenerationService
{
    public const int MinGeneratedQuestionCount = 5;
    public const int MaxGeneratedQuestionCount = 100;
    public const int SecondsPerQuestion = 72;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<QuizAttempt> CreateAttemptAsync(
        QuizGenerationRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var attempt = new QuizAttempt
        {
            UserId = request.UserId,
            Mode = request.Mode,
            CourseId = request.CourseId,
            TopicId = request.TopicId,
            TrialExamId = request.TrialExamId,
            GeneratedFromPastExams = request.GeneratedFromPastExams,
            PastExamFilterJson = request.PastExamFilters is null
                ? null
                : JsonSerializer.Serialize(request.PastExamFilters, JsonOptions),
            GeneratedFromWrongAnswers = request.GeneratedFromWrongAnswers,
            GeneratedFiltersJson = request.GeneratedFilters is null
                ? null
                : JsonSerializer.Serialize(request.GeneratedFilters, JsonOptions),
            Status = QuizAttemptStatus.Started,
            StartedAt = now,
            LastActivityAt = now,
            TotalQuestions = request.Questions.Count,
            AttemptQuestions = request.Questions
                .Select((question, index) => new QuizAttemptQuestion
                {
                    QuestionId = question.Id,
                    Order = index + 1
                })
                .ToList()
        };

        await attempts.AddAsync(attempt, cancellationToken);
        await attempts.SaveChangesAsync(cancellationToken);

        return attempt;
    }
}
