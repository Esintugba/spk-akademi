using System.Text.RegularExpressions;
using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public interface IDuplicateDetectionService
{
    Task<IReadOnlyList<DuplicateMatchDto>> FindDuplicatesAsync(
        IReadOnlyList<QuestionImportRowDto> rows,
        CancellationToken cancellationToken = default);
}

public class DuplicateDetectionService(IDuplicateDetectionRepository duplicateDetectionRepository) : IDuplicateDetectionService
{
    private static readonly Regex NonWordRegex = new("[^a-z0-9ığüşöçİĞÜŞÖÇ]+", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public async Task<IReadOnlyList<DuplicateMatchDto>> FindDuplicatesAsync(
        IReadOnlyList<QuestionImportRowDto> rows,
        CancellationToken cancellationToken = default)
    {
        var existing = await duplicateDetectionRepository.GetQuestionCandidatesAsync(cancellationToken);

        var existingNormalized = existing
            .Select(x => new { x.Id, x.Text, Normalized = Normalize(x.Text) })
            .ToList();

        var matches = new List<DuplicateMatchDto>();
        foreach (var row in rows)
        {
            var normalized = Normalize(row.QuestionText);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                continue;
            }

            foreach (var item in existingNormalized)
            {
                var score = Similarity(normalized, item.Normalized);
                var matchType = score >= 1m
                    ? DuplicateMatchType.Exact
                    : score >= 0.92m
                        ? DuplicateMatchType.Similar
                        : score >= 0.82m
                            ? DuplicateMatchType.PossibleDuplicate
                            : (DuplicateMatchType?)null;

                if (matchType.HasValue)
                {
                    matches.Add(new DuplicateMatchDto(
                        row.RowNumber,
                        null,
                        item.Id,
                        item.Text,
                        Math.Round(score, 3),
                        matchType.Value));
                    break;
                }
            }
        }

        return matches;
    }

    public static string Normalize(string value)
    {
        var lower = value.Trim().ToLowerInvariant();
        return NonWordRegex.Replace(lower, " ").Trim();
    }

    private static decimal Similarity(string left, string right)
    {
        if (left == right)
        {
            return 1m;
        }

        if (left.Length == 0 || right.Length == 0)
        {
            return 0m;
        }

        var distance = Levenshtein(left, right);
        var max = Math.Max(left.Length, right.Length);
        return 1m - (decimal)distance / max;
    }

    private static int Levenshtein(string source, string target)
    {
        var costs = new int[target.Length + 1];
        for (var j = 0; j <= target.Length; j++)
        {
            costs[j] = j;
        }

        for (var i = 1; i <= source.Length; i++)
        {
            costs[0] = i;
            var corner = i - 1;
            for (var j = 1; j <= target.Length; j++)
            {
                var upper = costs[j];
                costs[j] = source[i - 1] == target[j - 1]
                    ? corner
                    : Math.Min(Math.Min(costs[j - 1], upper), corner) + 1;
                corner = upper;
            }
        }

        return costs[target.Length];
    }
}
