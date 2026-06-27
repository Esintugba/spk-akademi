using System.Text.Json;
using API.Data;
using API.Dtos;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IImportValidationService
{
    Task<ImportPreviewDto> ValidateQuestionsAsync(
        IReadOnlyList<QuestionImportRowDto> rows,
        CancellationToken cancellationToken = default);
}

public class ImportValidationService(
    DataContext context,
    IValidator<QuestionImportRowDto> rowValidator,
    IDuplicateDetectionService duplicateDetectionService) : IImportValidationService
{
    public async Task<ImportPreviewDto> ValidateQuestionsAsync(
        IReadOnlyList<QuestionImportRowDto> rows,
        CancellationToken cancellationToken = default)
    {
        var courses = await context.Courses
            .AsNoTracking()
            .Select(x => new { x.Id, x.Name })
            .ToListAsync(cancellationToken);
        var topics = await context.Topics
            .AsNoTracking()
            .Include(x => x.Course)
            .Select(x => new { x.Id, x.Title, CourseName = x.Course!.Name })
            .ToListAsync(cancellationToken);

        var errors = new List<ImportErrorDto>();
        var missingCourses = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var missingTopics = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows)
        {
            var result = await rowValidator.ValidateAsync(row, cancellationToken);
            errors.AddRange(result.Errors.Select(error => new ImportErrorDto(
                row.RowNumber,
                error.PropertyName,
                error.ErrorMessage,
                JsonSerializer.Serialize(row))));

            var courseExists = courses.Any(x => string.Equals(x.Name, row.Course.Trim(), StringComparison.OrdinalIgnoreCase));
            if (!courseExists)
            {
                missingCourses.Add(row.Course);
                errors.Add(new ImportErrorDto(row.RowNumber, "Course", "Ders bulunamadı.", JsonSerializer.Serialize(row)));
                continue;
            }

            var topicExists = topics.Any(x =>
                string.Equals(x.CourseName, row.Course.Trim(), StringComparison.OrdinalIgnoreCase)
                && string.Equals(x.Title, row.Topic.Trim(), StringComparison.OrdinalIgnoreCase));

            if (!topicExists)
            {
                missingTopics.Add($"{row.Course} / {row.Topic}");
                errors.Add(new ImportErrorDto(row.RowNumber, "Topic", "Konu bulunamadı.", JsonSerializer.Serialize(row)));
            }
        }

        var duplicates = await duplicateDetectionService.FindDuplicatesAsync(rows, cancellationToken);
        var invalidRows = errors.Select(x => x.RowNumber).Distinct().Count();

        return new ImportPreviewDto(
            rows.Count,
            Math.Max(0, rows.Count - invalidRows - duplicates.Select(x => x.RowNumber).Distinct().Count()),
            invalidRows,
            duplicates.Select(x => x.RowNumber).Where(x => x.HasValue).Distinct().Count(),
            errors,
            duplicates,
            missingCourses.Where(x => !string.IsNullOrWhiteSpace(x)).OrderBy(x => x).ToList(),
            missingTopics.Where(x => !string.IsNullOrWhiteSpace(x)).OrderBy(x => x).ToList());
    }
}
