using API.Entities;

namespace API.Dtos;

public record StartCoursePracticeQuizRequestDto(
    Guid CourseId,
    int QuestionCount = 25,
    IReadOnlyList<QuestionDifficulty>? DifficultyLevels = null,
    IReadOnlyList<Guid>? TopicIds = null,
    bool IncludeWrongAnswered = true,
    bool RandomizeQuestions = true,
    bool RandomizeOptions = true);

public record CoursePracticeFilterDto(
    Guid CourseId,
    int QuestionCount,
    IReadOnlyList<QuestionDifficulty> DifficultyLevels,
    IReadOnlyList<Guid> TopicIds,
    bool IncludeWrongAnswered,
    bool RandomizeQuestions,
    bool RandomizeOptions);

public record CoursePracticeQuizResponseDto(
    Guid AttemptId,
    QuizMode QuizMode,
    Guid CourseId,
    string CourseName,
    int QuestionCount,
    int EstimatedDurationSeconds,
    DateTime GeneratedAt);

public record CoursePracticeCourseOptionDto(
    Guid CourseId,
    Guid LicenseId,
    string LicenseName,
    string CourseName,
    int TotalQuestionCount,
    int TopicCount,
    decimal SuccessRate,
    decimal ProgressPercentage);
