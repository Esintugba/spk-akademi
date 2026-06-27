using API.Entities;

namespace API.Dtos;

public record PublicQuestionDto(
    Guid Id,
    Guid TopicId,
    string TopicTitle,
    string Text,
    string? SourceReference,
    ContentAccessLevel AccessLevel,
    IReadOnlyList<QuizQuestionOptionDto> Options);

public record StartPublicMiniQuizDto(
    int QuestionCount,
    ContentAccessLevel AccessLevel);

public record SubmitPublicMiniQuizDto(
    IReadOnlyList<SubmitQuizAnswerDto> Answers);

public record PublicMiniQuizResultDto(
    int TotalQuestions,
    int CorrectCount,
    int WrongCount,
    decimal SuccessRate,
    IReadOnlyList<PublicMiniQuizResultAnswerDto> Answers);

public record PublicMiniQuizResultAnswerDto(
    Guid QuestionId,
    Guid? SelectedOptionId,
    bool IsCorrect,
    string Explanation);
