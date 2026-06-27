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
    IReadOnlyList<CreateQuestionOptionDto> Options);
