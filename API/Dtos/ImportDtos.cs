using API.Entities;
using Microsoft.AspNetCore.Http;

namespace API.Dtos;

public record QuestionImportRowDto(
    int RowNumber,
    string QuestionText,
    string? OptionA,
    string? OptionB,
    string? OptionC,
    string? OptionD,
    string? OptionE,
    string CorrectOption,
    string? Explanation,
    string Topic,
    string Course,
    string? Difficulty,
    int? ExamYear,
    string? ExamType);

public record ImportErrorDto(
    int RowNumber,
    string? ColumnName,
    string ErrorMessage,
    string? RawData);

public record DuplicateMatchDto(
    int? RowNumber,
    Guid? QuestionId,
    Guid MatchedQuestionId,
    string MatchedQuestionText,
    decimal SimilarityScore,
    DuplicateMatchType MatchType);

public record ImportPreviewDto(
    int TotalRows,
    int ValidRows,
    int InvalidRows,
    int DuplicateRows,
    IReadOnlyList<QuestionImportRowDto> Rows,
    IReadOnlyList<ImportErrorDto> Errors,
    IReadOnlyList<DuplicateMatchDto> Duplicates,
    IReadOnlyList<string> MissingCourses,
    IReadOnlyList<string> MissingTopics);

public record ImportJobDto(
    Guid Id,
    string FileName,
    ImportType ImportType,
    ImportJobStatus Status,
    int TotalRows,
    int SuccessfulRows,
    int FailedRows,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string CreatedByUserId,
    string? ErrorReportUrl,
    string? Summary,
    IReadOnlyList<ImportErrorDto> Errors);

public record DuplicateCheckRequestDto(
    IReadOnlyList<QuestionImportRowDto> Rows);

public enum DuplicateImportAction
{
    Skip = 1,
    Overwrite = 2,
    CreateNew = 3
}

public record DuplicateImportDecisionDto(
    int RowNumber,
    Guid? MatchedQuestionId,
    DuplicateImportAction Action);

public record ImportQuestionsRequestDto(
    IFormFile File,
    string? DuplicateActionsJson);

public record ImportMaterialRequestDto(
    Guid CourseId,
    string? Title,
    string? SourceName,
    IFormFile File);

public record MaterialImportResultDto(
    int TotalFiles,
    int ImportedFiles,
    int FailedFiles,
    IReadOnlyList<SourceDocumentDto> Documents,
    IReadOnlyList<ImportErrorDto> Errors);
