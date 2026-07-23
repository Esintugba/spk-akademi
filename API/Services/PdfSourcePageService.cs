using System.Text;
using System.Text.RegularExpressions;
using API.Configuration;
using Microsoft.Extensions.Options;

namespace API.Services;

public sealed record PdfSourcePage(int PageNumber, string Text);

public interface IPdfSourcePageService
{
    IReadOnlyList<PdfSourcePage> ParsePages(string extractedText);

    string SelectPageRange(string extractedText, int startPage, int endPage);
}

public partial class PdfSourcePageService(IOptions<AiQuestionGenerationOptions> options) : IPdfSourcePageService
{
    public IReadOnlyList<PdfSourcePage> ParsePages(string extractedText)
    {
        if (string.IsNullOrWhiteSpace(extractedText))
        {
            return [];
        }

        var matches = PageMarkerRegex().Matches(extractedText);
        if (matches.Count == 0)
        {
            return [];
        }

        var pages = new List<PdfSourcePage>(matches.Count);
        for (var index = 0; index < matches.Count; index++)
        {
            var match = matches[index];
            var textStart = match.Index + match.Length;
            var textEnd = index + 1 < matches.Count ? matches[index + 1].Index : extractedText.Length;
            var pageText = extractedText[textStart..textEnd].Trim();

            if (int.TryParse(match.Groups["page"].Value, out var pageNumber))
            {
                pages.Add(new PdfSourcePage(pageNumber, pageText));
            }
        }

        return pages;
    }

    public string SelectPageRange(string extractedText, int startPage, int endPage)
    {
        if (startPage < 1 || endPage < startPage)
        {
            throw new InvalidOperationException("Geçersiz PDF sayfa aralığı.");
        }

        var pages = ParsePages(extractedText)
            .Where(page => page.PageNumber >= startPage && page.PageNumber <= endPage)
            .OrderBy(page => page.PageNumber)
            .ToList();

        var expectedPageCount = endPage - startPage + 1;
        if (pages.Count != expectedPageCount)
        {
            var foundPages = pages.Count == 0
                ? "hiçbiri"
                : string.Join(", ", pages.Select(page => page.PageNumber));
            throw new InvalidOperationException(
                $"Seçilen sayfa aralığının tamamı çıkarılmış PDF metninde bulunamadı. Bulunan sayfalar: {foundPages}.");
        }

        var builder = new StringBuilder();
        foreach (var page in pages)
        {
            if (builder.Length > 0)
            {
                builder.AppendLine();
                builder.AppendLine();
            }

            builder.AppendLine($"--- Page {page.PageNumber} ---");
            builder.Append(page.Text);
        }

        var selectedText = builder.ToString().Trim();
        var maxCharacters = Math.Max(1_000, options.Value.MaxSourceCharacters);
        if (selectedText.Length > maxCharacters)
        {
            throw new InvalidOperationException(
                $"Seçilen sayfaların metni {maxCharacters:N0} karakter sınırını aşıyor. Daha dar bir sayfa aralığı seçin.");
        }

        return selectedText;
    }

    [GeneratedRegex(@"(?m)^\s*---\s*Page\s+(?<page>\d+)\s*---\s*$", RegexOptions.CultureInvariant)]
    private static partial Regex PageMarkerRegex();
}
