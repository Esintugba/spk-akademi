namespace API.Services;

public interface IPdfTextExtractor
{
    Task<PdfTextExtractionResult> ExtractAsync(string filePath);
}
