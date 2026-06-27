using API.Entities;

namespace API.Dtos;

public record QuizResultDetailDto(
    Guid AttemptId,
    string QuizTitle,
    QuizMode QuizMode,
    Guid? CourseId,
    string? CourseName,
    decimal Score,
    int CorrectCount,
    int WrongCount,
    int EmptyCount,
    int DurationSeconds,
    DateTime? CompletedAt,
    QuizResultAnalyticsDto Analytics,
    IReadOnlyList<QuizResultDetailAnswerDto> Answers,
    int Page,
    int PageSize,
    int TotalAnswerCount,
    bool HasNextPage);

public record QuizResultAnalyticsDto(
    IReadOnlyList<QuizTopicPerformanceDto> StrongTopics,
    IReadOnlyList<QuizTopicPerformanceDto> WeakTopics,
    double AverageQuestionTimeSeconds,
    QuizQuestionTimeInsightDto? FastestQuestion,
    QuizQuestionTimeInsightDto? SlowestQuestion);

public record QuizTopicPerformanceDto(
    Guid TopicId,
    string TopicName,
    string LessonName,
    int TotalQuestions,
    int CorrectCount,
    decimal SuccessRate);

public record QuizQuestionTimeInsightDto(
    Guid QuestionId,
    string QuestionText,
    int TimeSpentSeconds);

public record QuizResultDetailAnswerDto(
    Guid QuestionId,
    int Order,
    string QuestionText,
    IReadOnlyList<QuizResultOptionDto> Options,
    Guid? SelectedOptionId,
    Guid CorrectOptionId,
    bool IsCorrect,
    bool IsEmpty,
    QuizExplanationDto? Explanation,
    Guid TopicId,
    string TopicName,
    string LessonName,
    QuestionDifficulty DifficultyLevel,
    int? TimeSpentSeconds);

public record QuizResultOptionDto(
    Guid Id,
    string Label,
    string Text,
    bool IsCorrect,
    bool IsSelected);

public record QuizExplanationDto(
    string Explanation,
    string? SolutionNote,
    bool DefaultExpanded);
