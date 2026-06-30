using System.Text.Json;
using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IQuestionImportService
{
    Task<ImportPreviewDto> PreviewAsync(IFormFile file, CancellationToken cancellationToken = default);

    Task<ImportPreviewDto> DuplicateCheckAsync(
        IReadOnlyList<QuestionImportRowDto> rows,
        CancellationToken cancellationToken = default);

    Task<ImportJobDto> CreateQuestionImportJobAsync(
        IFormFile file,
        string adminUserId,
        IReadOnlyList<DuplicateImportDecisionDto>? duplicateDecisions = null,
        CancellationToken cancellationToken = default);

    Task<ImportJobDto?> GetJobAsync(Guid jobId, CancellationToken cancellationToken = default);

    Task ProcessJobAsync(Guid jobId, CancellationToken cancellationToken = default);
}

public class QuestionImportService(
    DataContext context,
    IImportFileParser parser,
    IImportValidationService validationService,
    IImportJobRepository jobRepository,
    IImportJobQueue queue,
    ILicenseCatalogCache licenseCatalogCache,
    ILogger<QuestionImportService> logger) : IQuestionImportService
{
    private const long MaxImportFileSize = 10 * 1024 * 1024;
    private static readonly string[] AllowedQuestionExtensions = [".csv", ".json", ".xlsx"];

    public async Task<ImportPreviewDto> PreviewAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        ValidateQuestionFile(file);
        var rows = await parser.ParseQuestionRowsAsync(file, cancellationToken);
        return await validationService.ValidateQuestionsAsync(rows, cancellationToken);
    }

    public Task<ImportPreviewDto> DuplicateCheckAsync(
        IReadOnlyList<QuestionImportRowDto> rows,
        CancellationToken cancellationToken = default) =>
        validationService.ValidateQuestionsAsync(rows, cancellationToken);

    public async Task<ImportJobDto> CreateQuestionImportJobAsync(
        IFormFile file,
        string adminUserId,
        IReadOnlyList<DuplicateImportDecisionDto>? duplicateDecisions = null,
        CancellationToken cancellationToken = default)
    {
        ValidateQuestionFile(file);

        var uploadsPath = Path.Combine(AppContext.BaseDirectory, "imports");
        Directory.CreateDirectory(uploadsPath);
        var storedFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        var storedPath = Path.Combine(uploadsPath, storedFileName);
        await using (var target = File.Create(storedPath))
        {
            await file.CopyToAsync(target, cancellationToken);
        }

        if (duplicateDecisions is { Count: > 0 })
        {
            var decisionsPath = GetDecisionsPath(storedPath);
            await File.WriteAllTextAsync(
                decisionsPath,
                JsonSerializer.Serialize(new ImportJobOptions(duplicateDecisions)),
                cancellationToken);
        }

        var job = new ImportJob
        {
            FileName = Path.GetFileName(file.FileName),
            ImportType = ImportType.Questions,
            Status = ImportJobStatus.Pending,
            CreatedByUserId = adminUserId,
            StoredFilePath = storedPath
        };

        await jobRepository.AddAsync(job, cancellationToken);
        await jobRepository.SaveAsync(cancellationToken);
        await queue.EnqueueAsync(job.Id, cancellationToken);
        return ToDto(job);
    }

    public async Task<ImportJobDto?> GetJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await jobRepository.GetByIdAsync(jobId, cancellationToken);
        return job is null ? null : ToDto(job);
    }

    public async Task ProcessJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await jobRepository.GetByIdAsync(jobId, cancellationToken);
        if (job is null || string.IsNullOrWhiteSpace(job.StoredFilePath))
        {
            return;
        }

        job.Status = ImportJobStatus.Processing;
        job.StartedAt = DateTime.UtcNow;
        await jobRepository.SaveAsync(cancellationToken);

        try
        {
            await using var fileStream = File.OpenRead(job.StoredFilePath);
            var formFile = new FormFile(fileStream, 0, fileStream.Length, "file", job.FileName);
            var rows = await parser.ParseQuestionRowsAsync(formFile, cancellationToken);
            var preview = await validationService.ValidateQuestionsAsync(rows, cancellationToken);
            var duplicateDecisions = await ReadDuplicateDecisionsAsync(job.StoredFilePath, cancellationToken);
            job.TotalRows = rows.Count;

            var invalidRows = preview.Errors.Select(x => x.RowNumber).ToHashSet();
            var duplicateByRow = preview.Duplicates
                .Where(x => x.RowNumber.HasValue)
                .GroupBy(x => x.RowNumber!.Value)
                .ToDictionary(x => x.Key, x => x.OrderByDescending(match => match.SimilarityScore).First());
            var importRows = rows
                .Where(x => !invalidRows.Contains(x.RowNumber))
                .Where(x => !duplicateByRow.ContainsKey(x.RowNumber) || ResolveDuplicateAction(x.RowNumber, duplicateDecisions) == DuplicateImportAction.CreateNew)
                .ToList();
            var overwriteRows = rows
                .Where(x => !invalidRows.Contains(x.RowNumber))
                .Where(x => duplicateByRow.ContainsKey(x.RowNumber) && ResolveDuplicateAction(x.RowNumber, duplicateDecisions) == DuplicateImportAction.Overwrite)
                .ToList();
            var skippedDuplicateRows = duplicateByRow.Keys
                .Where(rowNumber => !invalidRows.Contains(rowNumber) && ResolveDuplicateAction(rowNumber, duplicateDecisions) == DuplicateImportAction.Skip)
                .ToHashSet();

            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            var topics = await context.Topics.Include(x => x.Course).ToListAsync(cancellationToken);

            foreach (var chunk in importRows.Chunk(250))
            {
                var questions = chunk.Select(row =>
                {
                    var topic = topics.First(x =>
                        string.Equals(x.Title, row.Topic.Trim(), StringComparison.OrdinalIgnoreCase)
                        && string.Equals(x.Course!.Name, row.Course.Trim(), StringComparison.OrdinalIgnoreCase));

                    return new Question
                    {
                        TopicId = topic.Id,
                        Text = row.QuestionText.Trim(),
                        Difficulty = ParseDifficulty(row.Difficulty),
                        Type = QuestionType.Concept,
                        Explanation = row.Explanation?.Trim() ?? string.Empty,
                        IsPastExamQuestion = row.ExamYear.HasValue || !string.IsNullOrWhiteSpace(row.ExamType),
                        ExamYear = row.ExamYear,
                        ExamType = ParseExamType(row.ExamType),
                        ReviewStatus = ReviewStatus.PendingReview,
                        AccessLevel = ContentAccessLevel.Premium,
                        Options = BuildOptions(row)
                    };
                }).ToList();

                await context.Questions.AddRangeAsync(questions, cancellationToken);
                await context.SaveChangesAsync(cancellationToken);
            }

            foreach (var row in overwriteRows)
            {
                var duplicate = duplicateByRow[row.RowNumber];
                var decision = duplicateDecisions.FirstOrDefault(x => x.RowNumber == row.RowNumber);
                var targetQuestionId = decision?.MatchedQuestionId ?? duplicate.MatchedQuestionId;
                var question = await context.Questions
                    .Include(x => x.Options)
                    .FirstOrDefaultAsync(x => x.Id == targetQuestionId, cancellationToken);

                if (question is null)
                {
                    skippedDuplicateRows.Add(row.RowNumber);
                    continue;
                }

                var topic = topics.First(x =>
                    string.Equals(x.Title, row.Topic.Trim(), StringComparison.OrdinalIgnoreCase)
                    && string.Equals(x.Course!.Name, row.Course.Trim(), StringComparison.OrdinalIgnoreCase));

                question.TopicId = topic.Id;
                question.Text = row.QuestionText.Trim();
                question.Difficulty = ParseDifficulty(row.Difficulty);
                question.Type = QuestionType.Concept;
                question.Explanation = row.Explanation?.Trim() ?? string.Empty;
                question.IsPastExamQuestion = row.ExamYear.HasValue || !string.IsNullOrWhiteSpace(row.ExamType);
                question.ExamYear = row.ExamYear;
                question.ExamType = ParseExamType(row.ExamType);
                question.ReviewStatus = ReviewStatus.PendingReview;
                question.AccessLevel = ContentAccessLevel.Premium;
                question.UpdatedAt = DateTime.UtcNow;

                context.QuestionOptions.RemoveRange(question.Options);
                question.Options = BuildOptions(row);
                await context.SaveChangesAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);

            job.SuccessfulRows = importRows.Count + overwriteRows.Count - skippedDuplicateRows.Count(row => overwriteRows.Any(x => x.RowNumber == row));
            job.FailedRows = rows.Count - job.SuccessfulRows;
            job.Status = job.FailedRows == 0 ? ImportJobStatus.Completed : ImportJobStatus.PartiallyCompleted;
            job.CompletedAt = DateTime.UtcNow;
            job.Summary = JsonSerializer.Serialize(new
            {
                preview.ValidRows,
                preview.InvalidRows,
                preview.DuplicateRows,
                DuplicateActions = new
                {
                    Skipped = skippedDuplicateRows.Count,
                    CreatedNew = importRows.Count(x => duplicateByRow.ContainsKey(x.RowNumber)),
                    Overwritten = overwriteRows.Count - skippedDuplicateRows.Count(row => overwriteRows.Any(x => x.RowNumber == row))
                }
            });

            foreach (var error in preview.Errors)
            {
                job.Errors.Add(new ImportError
                {
                    RowNumber = error.RowNumber,
                    ColumnName = error.ColumnName,
                    ErrorMessage = error.ErrorMessage,
                    RawData = error.RawData
                });
            }

            foreach (var duplicate in preview.Duplicates)
            {
                if (!duplicate.RowNumber.HasValue || !skippedDuplicateRows.Contains(duplicate.RowNumber.Value))
                {
                    continue;
                }

                job.Errors.Add(new ImportError
                {
                    RowNumber = duplicate.RowNumber ?? 0,
                    ColumnName = "Duplicate",
                    ErrorMessage = $"{duplicate.MatchType} duplicate: {duplicate.SimilarityScore:P1}",
                    RawData = duplicate.MatchedQuestionText
                });
            }

            await jobRepository.SaveAsync(cancellationToken);
            licenseCatalogCache.Invalidate();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Question import job {JobId} failed.", jobId);
            job.Status = ImportJobStatus.Failed;
            job.CompletedAt = DateTime.UtcNow;
            job.FailedRows = job.TotalRows;
            job.Errors.Add(new ImportError
            {
                RowNumber = 0,
                ErrorMessage = ex.Message
            });
            await jobRepository.SaveAsync(CancellationToken.None);
        }
    }

    private static void ValidateQuestionFile(IFormFile file)
    {
        if (file.Length <= 0 || file.Length > MaxImportFileSize)
        {
            throw new InvalidOperationException("Dosya boyutu geçersiz veya çok büyük.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedQuestionExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Desteklenmeyen soru import formatı.");
        }
    }

    private static List<QuestionOption> BuildOptions(QuestionImportRowDto row)
    {
        var correct = row.CorrectOption.Trim().ToUpperInvariant();
        return new[]
            {
                ("A", row.OptionA),
                ("B", row.OptionB),
                ("C", row.OptionC),
                ("D", row.OptionD),
                ("E", row.OptionE)
            }
            .Where(x => !string.IsNullOrWhiteSpace(x.Item2))
            .Select(x => new QuestionOption
            {
                Label = x.Item1,
                Text = x.Item2!.Trim(),
                IsCorrect = x.Item1 == correct
            })
            .ToList();
    }

    private static QuestionDifficulty ParseDifficulty(string? value) =>
        Enum.TryParse<QuestionDifficulty>(value, true, out var difficulty) ? difficulty : QuestionDifficulty.Medium;

    private static ExamType? ParseExamType(string? value) =>
        Enum.TryParse<ExamType>(value, true, out var examType) ? examType : null;

    private static async Task<IReadOnlyList<DuplicateImportDecisionDto>> ReadDuplicateDecisionsAsync(
        string storedFilePath,
        CancellationToken cancellationToken)
    {
        var decisionsPath = GetDecisionsPath(storedFilePath);
        if (!File.Exists(decisionsPath))
        {
            return [];
        }

        try
        {
            var json = await File.ReadAllTextAsync(decisionsPath, cancellationToken);
            return JsonSerializer.Deserialize<ImportJobOptions>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })?.DuplicateDecisions ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string GetDecisionsPath(string storedFilePath) => $"{storedFilePath}.duplicate-decisions.json";

    private static DuplicateImportAction ResolveDuplicateAction(
        int rowNumber,
        IReadOnlyList<DuplicateImportDecisionDto> decisions) =>
        decisions.FirstOrDefault(x => x.RowNumber == rowNumber)?.Action ?? DuplicateImportAction.Skip;

    private static ImportJobDto ToDto(ImportJob job) =>
        new(
            job.Id,
            job.FileName,
            job.ImportType,
            job.Status,
            job.TotalRows,
            job.SuccessfulRows,
            job.FailedRows,
            job.StartedAt,
            job.CompletedAt,
            job.CreatedByUserId,
            job.ErrorReportUrl,
            job.Summary,
            job.Errors
                .OrderBy(x => x.RowNumber)
                .Select(x => new ImportErrorDto(x.RowNumber, x.ColumnName, x.ErrorMessage, x.RawData))
                .ToList());

    private sealed record ImportJobOptions(IReadOnlyList<DuplicateImportDecisionDto> DuplicateDecisions);
}
