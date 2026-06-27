using API.Dtos;
using API.Entities;
using API.Repositories;
using System.IO.Compression;

namespace API.Services;

public interface IAdminMaterialImportService
{
    long MaxMaterialImportSizeInBytes { get; }

    Task<MaterialImportResultDto> ImportMaterialsAsync(
        ImportMaterialRequestDto dto,
        CancellationToken cancellationToken = default);
}

public class AdminMaterialImportService(
    ISourceDocumentRepository sourceDocuments,
    ISourceDocumentFileStorage fileStorage,
    IPdfTextExtractor pdfTextExtractor) : IAdminMaterialImportService
{
    public long MaxMaterialImportSizeInBytes => 50 * 1024 * 1024;

    public async Task<MaterialImportResultDto> ImportMaterialsAsync(
        ImportMaterialRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(dto.File.FileName);
        return string.Equals(extension, ".zip", StringComparison.OrdinalIgnoreCase)
            ? await ImportZipAsync(dto, cancellationToken)
            : await ImportPdfAsync(dto, cancellationToken);
    }

    private async Task<MaterialImportResultDto> ImportPdfAsync(
        ImportMaterialRequestDto dto,
        CancellationToken cancellationToken)
    {
        var validationError = await ValidateMaterialUploadAsync(dto, cancellationToken);
        if (validationError is not null)
        {
            return new MaterialImportResultDto(
                1,
                0,
                1,
                [],
                [new ImportErrorDto(0, "File", validationError, dto.File.FileName)]);
        }

        var savedFile = await fileStorage.SavePdfAsync(dto.File, cancellationToken);
        PdfTextExtractionResult extractedText;

        try
        {
            extractedText = await pdfTextExtractor.ExtractAsync(savedFile.FullPath);
        }
        catch
        {
            fileStorage.DeleteLocalFile(savedFile.RelativePath);
            return new MaterialImportResultDto(
                1,
                0,
                1,
                [],
                [new ImportErrorDto(0, "File", "PDF metni cikarilamadi.", dto.File.FileName)]);
        }

        var document = new SourceDocument
        {
            CourseId = dto.CourseId,
            Title = string.IsNullOrWhiteSpace(dto.Title)
                ? Path.GetFileNameWithoutExtension(savedFile.OriginalFileName)
                : dto.Title.Trim(),
            FileName = savedFile.OriginalFileName,
            FilePath = savedFile.RelativePath,
            SourceName = string.IsNullOrWhiteSpace(dto.SourceName) ? "Bulk import" : dto.SourceName.Trim(),
            ReviewStatus = ReviewStatus.PendingReview,
            AccessLevel = ContentAccessLevel.Premium,
            PageCount = extractedText.PageCount,
            ExtractedText = extractedText.Text,
            TextExtractedAt = DateTime.UtcNow
        };

        await sourceDocuments.AddAsync(document, cancellationToken);
        await sourceDocuments.SaveChangesAsync(cancellationToken);

        return new MaterialImportResultDto(1, 1, 0, [ToSourceDocumentDto(document)], []);
    }

    private async Task<MaterialImportResultDto> ImportZipAsync(
        ImportMaterialRequestDto dto,
        CancellationToken cancellationToken)
    {
        var validationError = await ValidateMaterialUploadAsync(dto, cancellationToken);
        if (validationError is not null)
        {
            return new MaterialImportResultDto(
                0,
                0,
                1,
                [],
                [new ImportErrorDto(0, "File", validationError, dto.File.FileName)]);
        }

        await using var uploadStream = dto.File.OpenReadStream();
        using var archive = new ZipArchive(uploadStream, ZipArchiveMode.Read);
        var documents = new List<SourceDocumentDto>();
        var errors = new List<ImportErrorDto>();
        var rowNumber = 0;

        foreach (var entry in archive.Entries.Where(x => x.Length > 0))
        {
            cancellationToken.ThrowIfCancellationRequested();
            rowNumber++;

            if (!string.Equals(Path.GetExtension(entry.Name), ".pdf", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(new ImportErrorDto(
                    rowNumber,
                    "File",
                    "ZIP içinde yalnızca PDF dosyaları import edilir.",
                    entry.FullName));
                continue;
            }

            var savedFile = await fileStorage.SavePdfEntryAsync(entry, cancellationToken);
            if (savedFile is null)
            {
                errors.Add(new ImportErrorDto(rowNumber, "File", "Geçersiz PDF dosyası.", entry.FullName));
                continue;
            }

            PdfTextExtractionResult extractedText;
            try
            {
                extractedText = await pdfTextExtractor.ExtractAsync(savedFile.FullPath);
            }
            catch
            {
                fileStorage.DeleteLocalFile(savedFile.RelativePath);
                errors.Add(new ImportErrorDto(rowNumber, "File", "PDF metni çıkarılamadı.", entry.FullName));
                continue;
            }

            var document = new SourceDocument
            {
                CourseId = dto.CourseId,
                Title = Path.GetFileNameWithoutExtension(savedFile.OriginalFileName),
                FileName = savedFile.OriginalFileName,
                FilePath = savedFile.RelativePath,
                SourceName = string.IsNullOrWhiteSpace(dto.SourceName) ? "ZIP bulk import" : dto.SourceName.Trim(),
                ReviewStatus = ReviewStatus.PendingReview,
                AccessLevel = ContentAccessLevel.Premium,
                PageCount = extractedText.PageCount,
                ExtractedText = extractedText.Text,
                TextExtractedAt = DateTime.UtcNow
            };

            await sourceDocuments.AddAsync(document, cancellationToken);
            documents.Add(ToSourceDocumentDto(document));
        }

        await sourceDocuments.SaveChangesAsync(cancellationToken);

        return new MaterialImportResultDto(
            rowNumber,
            documents.Count,
            errors.Count,
            documents,
            errors);
    }

    private async Task<string?> ValidateMaterialUploadAsync(
        ImportMaterialRequestDto dto,
        CancellationToken cancellationToken)
    {
        if (!await sourceDocuments.CourseExistsAsync(dto.CourseId, cancellationToken))
        {
            return "CourseId geçersiz.";
        }

        if (dto.File.Length == 0)
        {
            return "PDF dosyası boş olamaz.";
        }

        if (dto.File.Length > MaxMaterialImportSizeInBytes)
        {
            return "Materyal dosyası 50 MB boyutunu aşamaz.";
        }

        var extension = Path.GetExtension(dto.File.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(extension, ".zip", StringComparison.OrdinalIgnoreCase))
        {
            return "Materyal import için PDF veya ZIP dosyası yükleyin.";
        }

        if (string.Equals(extension, ".zip", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!string.Equals(dto.File.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return "Dosya tipi application/pdf olmalı.";
        }

        await using var stream = dto.File.OpenReadStream();
        var signature = new byte[5];
        var bytesRead = await stream.ReadAsync(signature, cancellationToken);
        var header = System.Text.Encoding.ASCII.GetString(signature, 0, bytesRead);

        return header == "%PDF-" ? null : "Geçersiz PDF dosyası.";
    }

    private static SourceDocumentDto ToSourceDocumentDto(SourceDocument document)
    {
        return new SourceDocumentDto(
            document.Id,
            document.CourseId,
            document.Title,
            document.FileName,
            document.FilePath,
            document.SourceName,
            document.SourcePublishedAt,
            document.SourceUpdatedAt,
            document.PageCount,
            document.TextExtractedAt,
            document.ReviewStatus,
            document.AccessLevel,
            document.ReviewedById,
            document.ReviewedAt,
            document.ReviewComment);
    }
}
