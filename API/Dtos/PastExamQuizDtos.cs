using API.Entities;

namespace API.Dtos;

public record StartPastExamQuizRequestDto(
    IReadOnlyList<ExamType>? ExamTypes,
    IReadOnlyList<int>? Years,
    int QuestionCount = 25,
    bool OnlyPastExamQuestions = true,
    IReadOnlyList<Guid>? TopicIds = null,
    ExamSession? Session = null,
    QuestionDifficulty? Difficulty = null,
    bool MixedYears = true);

public record PastExamQuizStartResponseDto(
    Guid AttemptId,
    QuizMode QuizMode,
    int QuestionCount,
    DateTime GeneratedAt,
    int EstimatedDurationSeconds);

