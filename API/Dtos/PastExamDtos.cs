using API.Entities;

namespace API.Dtos;

public record PastExamQuestionDto(
    Guid Id,
    Guid TopicId,
    string TopicTitle,
    string Text,
    QuestionDifficulty Difficulty,
    QuestionType Type,
    bool IsPastExamQuestion,
    int? ExamYear,
    ExamType? ExamType,
    ExamSession? ExamSession,
    string? SourceReference);

public record PastExamQuestionListResponseDto(
    IReadOnlyList<PastExamQuestionDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public record PastExamQuestionFilterDto(
    IReadOnlyList<ExamType>? ExamTypes,
    IReadOnlyList<int>? Years,
    ExamSession? Session,
    IReadOnlyList<Guid>? TopicIds,
    QuestionDifficulty? Difficulty,
    string? Search);

public record PastExamQuestionQueryDto(
    string? ExamTypes,
    string? Years,
    string? Session,
    string? TopicIds,
    QuestionDifficulty? Difficulty,
    string? Search,
    int Page = 1,
    int PageSize = 20);

