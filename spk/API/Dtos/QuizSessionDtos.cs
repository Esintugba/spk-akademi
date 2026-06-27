using API.Entities;

namespace API.Dtos;

public record QuizSessionDto(
    Guid AttemptId,
    QuizMode QuizMode,
    QuizAttemptStatus Status,
    string Route,
    int? RemainingTimeSeconds,
    bool CanResume,
    DateTime StartedAt,
    DateTime? LastActivityAt,
    DateTime? ExpiresAt,
    string? Title);

public record QuizRouteDto(
    QuizMode QuizMode,
    string RouteTemplate);

public record ActiveQuizAttemptDto(
    Guid AttemptId,
    QuizMode QuizMode,
    QuizAttemptStatus Status,
    string Route,
    int? RemainingTimeSeconds,
    DateTime StartedAt,
    DateTime? LastActivityAt,
    string? Title);

public record ResumeQuizResponseDto(
    QuizSessionDto Session,
    bool HasConflict,
    ActiveQuizAttemptDto? ConflictingSession);
