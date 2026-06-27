using API.Entities;

namespace API.Dtos;

public record StartWrongAnswersQuizRequestDto(
    int QuestionCount = 25,
    Guid? CourseId = null,
    Guid? TopicId = null,
    QuestionDifficulty? Difficulty = null);

public record WrongAnswersQuizStartResponseDto(
    Guid AttemptId,
    QuizMode QuizMode,
    int QuestionCount,
    DateTime GeneratedAt,
    int EstimatedDuration);

public record WrongAnswerQueueItemDto(
    Guid QuestionId,
    string QuestionText,
    Guid TopicId,
    string TopicTitle,
    Guid CourseId,
    string CourseName,
    QuestionDifficulty Difficulty,
    int WrongCount,
    int ReviewCount,
    DateTime LastWrongAt,
    DateTime NextReviewAt,
    DateTime? LastReviewedAt,
    bool IsMastered,
    decimal SuccessRate);

public record WrongAnswerQueuePageDto(
    IReadOnlyList<WrongAnswerQueueItemDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    bool HasNextPage);

public record WrongAnswerStatsDto(
    int TotalWrongQuestions,
    int DueForReview,
    int MasteredQuestions,
    int TodaySolved,
    decimal WeeklyAccuracy,
    IReadOnlyList<WeakTopicInsightDto> WeakTopics);

public record WeakTopicInsightDto(
    Guid TopicId,
    string TopicTitle,
    string CourseName,
    int WrongCount,
    decimal SuccessRate);

public record RemoveFromQueueResultDto(Guid QuestionId, bool Removed);
