namespace API.Services;

public record PdfTextExtractionResult(
    int PageCount,
    string Text);
