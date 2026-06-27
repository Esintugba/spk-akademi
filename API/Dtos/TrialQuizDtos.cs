using API.Entities;

namespace API.Dtos;

public record StartLicensedQuizRequestDto(Guid QuizId);

public record QuizAttemptResponseDto(
    Guid AttemptId,
    Guid QuizId,
    DateTime StartedAt,
    int RemainingTime,
    QuizAttemptStatus Status);

public record StudentAccessibleTrialDto(
    Guid QuizId,
    string Title,
    string? LicenseName,
    Guid? LicenseId,
    int DurationMinutes,
    int QuestionCount,
    bool IsFree,
    StudentTrialProgressStatus ProgressStatus,
    Guid? ActiveAttemptId,
    int? RemainingTimeSeconds,
    DateTime? LastAttemptAt,
    decimal? LastSuccessRate);

public enum StudentTrialProgressStatus
{
    NotStarted = 0,
    InProgress = 1,
    Completed = 2
}
