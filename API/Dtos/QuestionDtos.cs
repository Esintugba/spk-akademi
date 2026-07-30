using API.Entities;

namespace API.Dtos;

public record QuestionDto(
    Guid Id,
    Guid TopicId,
    string Text,
    QuestionDifficulty Difficulty,
    QuestionType Type,
    string Explanation,
    bool IsPastExamQuestion,
    int? ExamYear,
    ExamType? ExamType,
    ExamSession? ExamSession,
    string? SourceReference,
    string? SourceText,
    bool IsAiGenerated,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewComment,
    IReadOnlyList<QuestionOptionDto> Options);

public record QuestionListItemDto(
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
    string? SourceReference,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    int OptionCount);

public record QuestionListResponseDto(
    IReadOnlyList<QuestionListItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public record QuestionListQueryDto(
    Guid? TopicId,
    QuestionDifficulty? Difficulty,
    ReviewStatus? ReviewStatus,
    bool? IsPastExamQuestion,
    string? Search,
    int Page = 1,
    int PageSize = 24);

public record QuestionFilterDto(
    Guid? TopicId,
    ReviewStatus? ReviewStatus);

public record QuestionOptionDto(
    Guid Id,
    string Label,
    string Text,
    bool IsCorrect);

public record CreateQuestionDto(
    Guid TopicId,
    string Text,
    QuestionDifficulty Difficulty,
    QuestionType Type,
    string Explanation,
    bool IsPastExamQuestion,
    int? ExamYear,
    ExamType? ExamType,
    ExamSession? ExamSession,
    string? SourceReference,
    string? SourceText,
    bool IsAiGenerated,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    IReadOnlyList<CreateQuestionOptionDto> Options);

public record CreateQuestionOptionDto(
    string Label,
    string Text,
    bool IsCorrect);

public record UpdateQuestionDto(
    Guid TopicId,
    string Text,
    QuestionDifficulty Difficulty,
    QuestionType Type,
    string Explanation,
    bool IsPastExamQuestion,
    int? ExamYear,
    ExamType? ExamType,
    ExamSession? ExamSession,
    string? SourceReference,
    string? SourceText,
    bool IsAiGenerated,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    IReadOnlyList<UpdateQuestionOptionDto> Options);

public record UpdateQuestionOptionDto(
    Guid? Id,
    string Label,
    string Text,
    bool IsCorrect);
