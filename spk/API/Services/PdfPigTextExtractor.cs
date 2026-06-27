using System.Text;
using UglyToad.PdfPig;

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

            textBuilder.AppendLine($"--- Page {page.Number} ---");
            textBuilder.AppendLine(page.Text);
        }

        return Task.FromResult(new PdfTextExtractionResult(
            document.NumberOfPages,
            textBuilder.ToString().Trim()));
    }
}
