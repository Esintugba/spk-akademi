using API.Entities;

namespace API.Dtos;

public record CreateAiQuestionGenerationJobDto(
    Guid SourceDocumentId,
    Guid TopicId,
    int StartPage,
    int EndPage,
    int EasyQuestionCount,
    int MediumQuestionCount,
    int HardQuestionCount,
    bool IncludeExplanations = true);

public record AiQuestionGenerationJobDto(
    Guid Id,
    Guid SourceDocumentId,
    string SourceDocumentTitle,
    Guid TopicId,
    string TopicTitle,
    int StartPage,
    int EndPage,
    int EasyQuestionCount,
    int MediumQuestionCount,
    int HardQuestionCount,
    bool IncludeExplanations,
    string Model,
    AiQuestionGenerationJobStatus Status,
    int GeneratedQuestionCount,
    int InputTokens,
    int OutputTokens,
    string? ErrorMessage,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt);

public record AiQuestionDraftDto(
    Guid Id,
    Guid JobId,
    string QuestionText,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    string? OptionE,
    string CorrectOption,
    string Explanation,
    QuestionDifficulty Difficulty,
    int SourcePage,
    string SourceExcerpt,
    AiQuestionDraftStatus Status,
    Guid? PublishedQuestionId);

public record UpdateAiQuestionDraftDto(
    string QuestionText,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    string? OptionE,
    string CorrectOption,
    string Explanation,
    QuestionDifficulty Difficulty,
    int SourcePage,
    string SourceExcerpt);

public record PublishAiQuestionDraftsDto(IReadOnlyList<Guid> DraftIds);
