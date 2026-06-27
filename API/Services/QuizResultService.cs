using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum QuizResultDetailError
{
    None,
    NotFound,
    NotCompleted,
    Forbidden
}

public sealed class QuizResultDetailOutcome
{
    public QuizResultDetailError Error { get; init; }

    public QuizResultDetailDto? Result { get; init; }

    public static QuizResultDetailOutcome Success(QuizResultDetailDto result) =>
        new() { Error = QuizResultDetailError.None, Result = result };

    public static QuizResultDetailOutcome Fail(QuizResultDetailError error) =>
        new() { Error = error };
}

public interface IQuizResultService
{
    Task<QuizResultDetailOutcome> GetResultDetailAsync(
        Guid attemptId,
        string? userId,
        int page,
        int pageSize,
        bool includeExplanations,
        CancellationToken cancellationToken = default);
}

public class QuizResultService(IQuizResultRepository quizResultRepository) : IQuizResultService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 50;

    public async Task<QuizResultDetailOutcome> GetResultDetailAsync(
        Guid attemptId,
        string? userId,
        int page,
        int pageSize,
        bool includeExplanations,
        CancellationToken cancellationToken = default)
    {
        var attempt = await quizResultRepository.GetCompletedAttemptForResultAsync(
            attemptId,
            userId,
            cancellationToken);

        if (attempt is null)
        {
            if (await quizResultRepository.ExistsIncompleteAttemptAsync(attemptId, userId, cancellationToken))
            {
                return QuizResultDetailOutcome.Fail(QuizResultDetailError.NotCompleted);
            }

            return QuizResultDetailOutcome.Fail(QuizResultDetailError.NotFound);
        }

        if (!CanAccess(attempt, userId))
        {
            return QuizResultDetailOutcome.Fail(QuizResultDetailError.Forbidden);
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize <= 0 ? DefaultPageSize : pageSize, 1, MaxPageSize);

        var answersByQuestionId = attempt.Answers.ToDictionary(x => x.QuestionId);
        var orderedAttemptQuestions = attempt.AttemptQuestions
            .OrderBy(x => x.Order)
            .Where(x => x.Question is not null &&
                        !x.Question.IsDeleted &&
                        x.Question.ReviewStatus == ReviewStatus.Approved)
            .ToList();

        var allAnswerDtos = orderedAttemptQuestions
            .Select(aq => BuildAnswerDto(aq, answersByQuestionId.GetValueOrDefault(aq.QuestionId), includeExplanations))
            .ToList();

        var emptyCount = allAnswerDtos.Count(x => x.IsEmpty);
        var durationSeconds = attempt.FinishedAt.HasValue
            ? (int)Math.Max(1, (attempt.FinishedAt.Value - attempt.StartedAt).TotalSeconds)
            : 0;

        var score = attempt.TotalQuestions == 0
            ? 0
            : Math.Round((decimal)attempt.CorrectCount / attempt.TotalQuestions * 100, 1);

        var analytics = BuildAnalytics(allAnswerDtos);
        var totalCount = allAnswerDtos.Count;
        var pagedAnswers = allAnswerDtos
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return QuizResultDetailOutcome.Success(new QuizResultDetailDto(
            attempt.Id,
            ResolveQuizTitle(attempt),
            attempt.Mode,
            attempt.CourseId,
            attempt.Course?.Name ?? attempt.Topic?.Course?.Name,
            score,
            attempt.CorrectCount,
            attempt.WrongCount,
            emptyCount,
            durationSeconds,
            attempt.FinishedAt,
            analytics,
            pagedAnswers,
            page,
            pageSize,
            totalCount,
            page * pageSize < totalCount));
    }

    private static bool CanAccess(QuizAttempt attempt, string? userId)
    {
        if (string.IsNullOrWhiteSpace(attempt.UserId))
        {
            return attempt.Mode == QuizMode.TrialExam && attempt.TrialExamId.HasValue;
        }

        return string.IsNullOrWhiteSpace(userId) || attempt.UserId == userId;
    }

    private static string ResolveQuizTitle(QuizAttempt attempt) =>
        attempt.Mode switch
        {
            QuizMode.TrialExam when attempt.TrialExam is not null => attempt.TrialExam.Title,
            QuizMode.TopicPractice when attempt.Topic is not null =>
                $"{attempt.Topic.Course?.Name ?? "Ders"} · {attempt.Topic.Title}",
            QuizMode.CoursePractice when attempt.Course is not null => attempt.Course.Name,
            QuizMode.WrongAnswers => "Yanlışlarım Tekrar Testi",
            QuizMode.MixedPractice => "Karışık Pratik Testi",
            _ => "Quiz Sonucu"
        };

    private static QuizResultDetailAnswerDto BuildAnswerDto(
        QuizAttemptQuestion attemptQuestion,
        QuizAnswer? userAnswer,
        bool includeExplanations)
    {
        var question = attemptQuestion.Question!;
        var topic = question.Topic;
        var course = topic?.Course;
        var correctOption = question.Options.Single(x => x.IsCorrect);
        var selectedOptionId = userAnswer?.SelectedOptionId;
        var isEmpty = !selectedOptionId.HasValue;
        var isCorrect = userAnswer?.IsCorrect ?? false;

        var options = question.Options
            .OrderBy(x => x.Label)
            .Select(option => new QuizResultOptionDto(
                option.Id,
                option.Label,
                option.Text,
                option.IsCorrect,
                option.Id == selectedOptionId))
            .ToList();

        QuizExplanationDto? explanation = includeExplanations
            ? new QuizExplanationDto(
                question.Explanation,
                question.SolutionNote,
                DefaultExpanded: !isCorrect)
            : null;

        return new QuizResultDetailAnswerDto(
            question.Id,
            attemptQuestion.Order,
            question.Text,
            options,
            selectedOptionId,
            correctOption.Id,
            isCorrect,
            isEmpty,
            explanation,
            topic?.Id ?? Guid.Empty,
            topic?.Title ?? "Konu",
            course?.Name ?? "Ders",
            question.Difficulty,
            userAnswer?.TimeSpentSeconds);
    }

    private static QuizResultAnalyticsDto BuildAnalytics(IReadOnlyList<QuizResultDetailAnswerDto> answers)
    {
        var topicGroups = answers
            .Where(x => x.TopicId != Guid.Empty)
            .GroupBy(x => new { x.TopicId, x.TopicName, x.LessonName })
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                var rate = total == 0 ? 0 : Math.Round((decimal)correct / total * 100, 1);

                return new QuizTopicPerformanceDto(
                    g.Key.TopicId,
                    g.Key.TopicName,
                    g.Key.LessonName,
                    total,
                    correct,
                    rate);
            })
            .ToList();

        var strongTopics = topicGroups
            .Where(x => x.TotalQuestions >= 2 && x.SuccessRate >= 70)
            .OrderByDescending(x => x.SuccessRate)
            .Take(5)
            .ToList();

        var weakTopics = topicGroups
            .Where(x => x.TotalQuestions >= 1 && x.SuccessRate < 60)
            .OrderBy(x => x.SuccessRate)
            .Take(5)
            .ToList();

        var timedAnswers = answers.Where(x => x.TimeSpentSeconds.HasValue).ToList();
        var averageTime = timedAnswers.Count == 0
            ? 0
            : timedAnswers.Average(x => x.TimeSpentSeconds!.Value);

        QuizQuestionTimeInsightDto? fastest = null;
        QuizQuestionTimeInsightDto? slowest = null;

        if (timedAnswers.Count > 0)
        {
            var fastestAnswer = timedAnswers.MinBy(x => x.TimeSpentSeconds)!;
            var slowestAnswer = timedAnswers.MaxBy(x => x.TimeSpentSeconds)!;

            fastest = new QuizQuestionTimeInsightDto(
                fastestAnswer.QuestionId,
                Truncate(fastestAnswer.QuestionText, 80),
                fastestAnswer.TimeSpentSeconds!.Value);

            slowest = new QuizQuestionTimeInsightDto(
                slowestAnswer.QuestionId,
                Truncate(slowestAnswer.QuestionText, 80),
                slowestAnswer.TimeSpentSeconds!.Value);
        }

        return new QuizResultAnalyticsDto(
            strongTopics,
            weakTopics,
            Math.Round(averageTime, 1),
            fastest,
            slowest);
    }

    private static string Truncate(string text, int maxLength) =>
        text.Length <= maxLength ? text : text[..maxLength] + "…";
}
