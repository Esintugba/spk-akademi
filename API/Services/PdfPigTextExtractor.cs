using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace API.Services;

public class PdfPigTextExtractor : IPdfTextExtractor
{
    public Task<PdfTextExtractionResult> ExtractAsync(string filePath)
    {
        using var document = PdfDocument.Open(filePath);
        var textBuilder = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            if (textBuilder.Length > 0)
            {
                textBuilder.AppendLine();
                textBuilder.AppendLine();
            }

            var pageText = ContentOrderTextExtractor.GetText(
                page,
                new ContentOrderTextExtractor.Options
                {
                    NegativeGapAsWhitespace = true,
                    ReplaceWhitespaceWithSpace = true,
                    SeparateParagraphsWithDoubleNewline = true
                });

            textBuilder.AppendLine($"--- Page {page.Number} ---");
            textBuilder.AppendLine(PdfTextNormalizer.Normalize(pageText));
        }

        return Task.FromResult(new PdfTextExtractionResult(
            document.NumberOfPages,
            textBuilder.ToString().Trim()));
    }
}
