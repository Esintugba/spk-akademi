using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace API.Services;

public enum SourceDocumentError
{
    None,
    Unauthorized,
    Forbidden,
    NotFound,
    InvalidCourse,
    InvalidFile,
    TextExtractionFailed,
    FileMissing
}

public sealed class SourceDocumentOutcome<T>
{
    public SourceDocumentError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static SourceDocumentOutcome<T> Success(T result) =>
        new() { Error = SourceDocumentError.None, Result = result };

    public static SourceDocumentOutcome<T> Fail(SourceDocumentError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public sealed record SourceDocumentDownloadDto(
    string FullPath,
    string FileName,
    string ContentType);

public interface ISourceDocumentService
{
    long MaxPdfSizeInBytes { get; }

    Task<SourceDocumentOutcome<IReadOnlyList<SourceDocumentDto>>> GetDocumentsAsync(
        string? userId,
        AppUser? user,
        Guid? courseId,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentDto>> GetDocumentAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentDto>> CreateDocumentAsync(
        CreateSourceDocumentDto dto,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentDto>> UploadDocumentAsync(
        UploadSourceDocumentDto dto,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<bool>> UpdateDocumentAsync(
        Guid id,
        UpdateSourceDocumentDto dto,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentDto>> ReplaceDocumentFileAsync(
        Guid id,
        UploadSourceDocumentDto dto,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentTextDto>> ExtractTextAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentTextDto>> GetTextAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<SourceDocumentDownloadDto>> GetDownloadAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<SourceDocumentOutcome<bool>> DeleteDocumentAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class SourceDocumentService(
    ISourceDocumentRepository documents,
    ISourceDocumentFileStorage fileStorage,
    IPdfTextExtractor pdfTextExtractor,
    ILicenseAccessService accessService,
    UserManager<AppUser> userManager,
    ILicenseCatalogCache licenseCatalogCache) : ISourceDocumentService
{
    public long MaxPdfSizeInBytes => fileStorage.MaxPdfSizeInBytes;

    public async Task<SourceDocumentOutcome<IReadOnlyList<SourceDocumentDto>>> GetDocumentsAsync(
        string? userId,
        AppUser? user,
        Guid? courseId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return SourceDocumentOutcome<IReadOnlyList<SourceDocumentDto>>.Fail(SourceDocumentError.Unauthorized);
        }

        var accessibleLicenseIds = await accessService.GetAccessibleLicenseIds(userId);
        var includeUnapproved = user is not null && await userManager.IsInRoleAsync(user, AppRoles.Admin);
        var items = await documents.GetDocumentsAsync(
            accessibleLicenseIds,
            courseId,
            includeUnapproved,
            cancellationToken);

        return SourceDocumentOutcome<IReadOnlyList<SourceDocumentDto>>.Success(items.Select(ToDto).ToList());
    }

    public async Task<SourceDocumentOutcome<SourceDocumentDto>> GetDocumentAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var documentOutcome = await GetAccessibleDocumentAsync(userId, id, cancellationToken);
        return documentOutcome.Error == SourceDocumentError.None && documentOutcome.Result is not null
            ? SourceDocumentOutcome<SourceDocumentDto>.Success(ToDto(documentOutcome.Result))
            : SourceDocumentOutcome<SourceDocumentDto>.Fail(documentOutcome.Error, documentOutcome.Message);
    }

    public async Task<SourceDocumentOutcome<SourceDocumentDto>> CreateDocumentAsync(
        CreateSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!await documents.CourseExistsAsync(dto.CourseId, cancellationToken))
        {
            return SourceDocumentOutcome<SourceDocumentDto>.Fail(SourceDocumentError.InvalidCourse, "CourseId gecersiz.");
        }

        var document = new SourceDocument
        {
            CourseId = dto.CourseId,
            Title = dto.Title,
            FileName = dto.FileName,
            FilePath = dto.FilePath,
            SourceName = dto.SourceName,
            SourcePublishedAt = dto.SourcePublishedAt,
            SourceUpdatedAt = dto.SourceUpdatedAt,
            ReviewStatus = ReviewStatus.PendingReview
        };

        var filePath = fileStorage.GetLocalFilePath(document.FilePath);
        if (filePath is not null && File.Exists(filePath))
        {
            await ApplyExtractedTextAsync(document, filePath);
        }

        await documents.AddAsync(document, cancellationToken);
        await documents.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return SourceDocumentOutcome<SourceDocumentDto>.Success(ToDto(document));
    }

    public async Task<SourceDocumentOutcome<SourceDocumentDto>> UploadDocumentAsync(
        UploadSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var validation = await ValidateUploadAsync(dto.CourseId, dto.File, cancellationToken);
        if (validation is not null)
        {
            return SourceDocumentOutcome<SourceDocumentDto>.Fail(validation.Value.Error, validation.Value.Message);
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
            return SourceDocumentOutcome<SourceDocumentDto>.Fail(
                SourceDocumentError.TextExtractionFailed,
                "PDF metni çıkarılamadı.");
        }

        var document = new SourceDocument
        {
            CourseId = dto.CourseId,
            Title = dto.Title,
            FileName = savedFile.OriginalFileName,
            FilePath = savedFile.RelativePath,
            SourceName = dto.SourceName,
            SourcePublishedAt = dto.SourcePublishedAt,
            SourceUpdatedAt = dto.SourceUpdatedAt,
            ReviewStatus = ReviewStatus.PendingReview,
            PageCount = extractedText.PageCount,
            ExtractedText = extractedText.Text,
            TextExtractedAt = DateTime.UtcNow
        };

        await documents.AddAsync(document, cancellationToken);
        await documents.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return SourceDocumentOutcome<SourceDocumentDto>.Success(ToDto(document));
    }

    public async Task<SourceDocumentOutcome<bool>> UpdateDocumentAsync(
        Guid id,
        UpdateSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var document = await documents.GetByIdForUpdateAsync(id, cancellationToken);
        if (document is null)
        {
            return SourceDocumentOutcome<bool>.Fail(SourceDocumentError.NotFound);
        }

        if (!await documents.CourseExistsAsync(dto.CourseId, cancellationToken))
        {
            return SourceDocumentOutcome<bool>.Fail(SourceDocumentError.InvalidCourse, "CourseId gecersiz.");
        }

        document.CourseId = dto.CourseId;
        document.Title = dto.Title;
        document.FileName = dto.FileName;
        document.FilePath = dto.FilePath;
        document.SourceName = dto.SourceName;
        document.SourcePublishedAt = dto.SourcePublishedAt;
        document.SourceUpdatedAt = dto.SourceUpdatedAt;
        document.ReviewStatus = ReviewStatus.PendingReview;
        document.UpdatedAt = DateTime.UtcNow;

        await documents.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return SourceDocumentOutcome<bool>.Success(true);
    }

    public async Task<SourceDocumentOutcome<SourceDocumentDto>> ReplaceDocumentFileAsync(
        Guid id,
        UploadSourceDocumentDto dto,
        CancellationToken cancellationToken = default)
    {
        var document = await documents.GetByIdForUpdateAsync(id, cancellationToken);
        if (document is null)
        {
            return SourceDocumentOutcome<SourceDocumentDto>.Fail(SourceDocumentError.NotFound);
        }

        var validation = await ValidateUploadAsync(dto.CourseId, dto.File, cancellationToken);
        if (validation is not null)
        {
            return SourceDocumentOutcome<SourceDocumentDto>.Fail(validation.Value.Error, validation.Value.Message);
        }

        var oldFilePath = document.FilePath;
        var savedFile = await fileStorage.SavePdfAsync(dto.File, cancellationToken);

        PdfTextExtractionResult extractedText;
        try
        {
            extractedText = await pdfTextExtractor.ExtractAsync(savedFile.FullPath);
        }
        catch
        {
            fileStorage.DeleteLocalFile(savedFile.RelativePath);
            return SourceDocumentOutcome<SourceDocumentDto>.Fail(
                SourceDocumentError.TextExtractionFailed,
                "PDF metni çıkarılamadı.");
        }

        document.CourseId = dto.CourseId;
        document.Title = dto.Title;
        document.FileName = savedFile.OriginalFileName;
        document.FilePath = savedFile.RelativePath;
        document.SourceName = dto.SourceName;
        document.SourcePublishedAt = dto.SourcePublishedAt;
        document.SourceUpdatedAt = dto.SourceUpdatedAt;
        document.ReviewStatus = ReviewStatus.PendingReview;
        document.PageCount = extractedText.PageCount;
        document.ExtractedText = extractedText.Text;
        document.TextExtractedAt = DateTime.UtcNow;
        document.UpdatedAt = DateTime.UtcNow;

        await documents.SaveChangesAsync(cancellationToken);
        fileStorage.DeleteLocalFile(oldFilePath);
        licenseCatalogCache.Invalidate();

        return SourceDocumentOutcome<SourceDocumentDto>.Success(ToDto(document));
    }

    public async Task<SourceDocumentOutcome<SourceDocumentTextDto>> ExtractTextAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var document = await documents.GetByIdForUpdateAsync(id, cancellationToken);
        if (document is null)
        {
            return SourceDocumentOutcome<SourceDocumentTextDto>.Fail(SourceDocumentError.NotFound);
        }

        var filePath = fileStorage.GetLocalFilePath(document.FilePath);
        if (filePath is null || !File.Exists(filePath))
        {
            return SourceDocumentOutcome<SourceDocumentTextDto>.Fail(
                SourceDocumentError.FileMissing,
                "Dosya bulunamadı.");
        }

        await ApplyExtractedTextAsync(document, filePath);
        document.UpdatedAt = DateTime.UtcNow;

        await documents.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return SourceDocumentOutcome<SourceDocumentTextDto>.Success(ToTextDto(document));
    }

    public async Task<SourceDocumentOutcome<SourceDocumentTextDto>> GetTextAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var documentOutcome = await GetAccessibleDocumentAsync(userId, id, cancellationToken);
        return documentOutcome.Error == SourceDocumentError.None && documentOutcome.Result is not null
            ? SourceDocumentOutcome<SourceDocumentTextDto>.Success(ToTextDto(documentOutcome.Result))
            : SourceDocumentOutcome<SourceDocumentTextDto>.Fail(documentOutcome.Error, documentOutcome.Message);
    }

    public async Task<SourceDocumentOutcome<SourceDocumentDownloadDto>> GetDownloadAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var documentOutcome = await GetAccessibleDocumentAsync(userId, id, cancellationToken);
        if (documentOutcome.Error != SourceDocumentError.None || documentOutcome.Result is null)
        {
            return SourceDocumentOutcome<SourceDocumentDownloadDto>.Fail(
                documentOutcome.Error,
                documentOutcome.Message);
        }

        var document = documentOutcome.Result;
        var filePath = fileStorage.GetLocalFilePath(document.FilePath);
        if (filePath is null || !File.Exists(filePath))
        {
            return SourceDocumentOutcome<SourceDocumentDownloadDto>.Fail(
                SourceDocumentError.FileMissing,
                "Dosya bulunamadı.");
        }

        return SourceDocumentOutcome<SourceDocumentDownloadDto>.Success(
            new SourceDocumentDownloadDto(filePath, document.FileName, "application/pdf"));
    }

    public async Task<SourceDocumentOutcome<bool>> DeleteDocumentAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var document = await documents.GetByIdForUpdateAsync(id, cancellationToken);
        if (document is null)
        {
            return SourceDocumentOutcome<bool>.Fail(SourceDocumentError.NotFound);
        }

        document.IsDeleted = true;
        document.DeletedAt = DateTime.UtcNow;
        document.UpdatedAt = DateTime.UtcNow;

        await documents.SaveChangesAsync(cancellationToken);
        fileStorage.DeleteLocalFile(document.FilePath);
        licenseCatalogCache.Invalidate();

        return SourceDocumentOutcome<bool>.Success(true);
    }

    private async Task<SourceDocumentOutcome<SourceDocument>> GetAccessibleDocumentAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return SourceDocumentOutcome<SourceDocument>.Fail(SourceDocumentError.Unauthorized);
        }

        var document = await documents.GetByIdAsync(id, cancellationToken);
        if (document is null)
        {
            return SourceDocumentOutcome<SourceDocument>.Fail(SourceDocumentError.NotFound);
        }

        if (!await accessService.CanAccessCourse(userId, document.CourseId))
        {
            return SourceDocumentOutcome<SourceDocument>.Fail(SourceDocumentError.Forbidden);
        }

        return SourceDocumentOutcome<SourceDocument>.Success(document);
    }

    private async Task<(SourceDocumentError Error, string Message)?> ValidateUploadAsync(
        Guid courseId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (!await documents.CourseExistsAsync(courseId, cancellationToken))
        {
            return (SourceDocumentError.InvalidCourse, "CourseId geçersiz.");
        }

        var fileValidation = await fileStorage.ValidatePdfAsync(file, cancellationToken);
        return fileValidation.Success
            ? null
            : (SourceDocumentError.InvalidFile, fileValidation.Message ?? "PDF dosyası geçersiz.");
    }

    private async Task ApplyExtractedTextAsync(SourceDocument document, string filePath)
    {
        var result = await pdfTextExtractor.ExtractAsync(filePath);

        document.PageCount = result.PageCount;
        document.ExtractedText = result.Text;
        document.TextExtractedAt = DateTime.UtcNow;
    }

    private static SourceDocumentDto ToDto(SourceDocument document)
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
            document.ReviewedBy?.Email,
            document.ReviewedAt,
            document.ReviewComment);
    }

    private static SourceDocumentTextDto ToTextDto(SourceDocument document)
    {
        return new SourceDocumentTextDto(
            document.Id,
            document.CourseId,
            document.Title,
            document.PageCount,
            document.TextExtractedAt,
            document.ExtractedText ?? string.Empty);
    }
}
