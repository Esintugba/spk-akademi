using Microsoft.AspNetCore.Http;
using System.IO.Compression;

namespace API.Services;

public enum SourceDocumentFileError
{
    None,
    EmptyFile,
    TooLarge,
    InvalidExtension,
    InvalidContentType,
    InvalidSignature
}

public sealed record SourceDocumentFileValidationResult(
    SourceDocumentFileError Error,
    string? Message)
{
    public bool Success => Error == SourceDocumentFileError.None;

    public static SourceDocumentFileValidationResult Valid() =>
        new(SourceDocumentFileError.None, null);

    public static SourceDocumentFileValidationResult Invalid(SourceDocumentFileError error, string message) =>
        new(error, message);
}

public sealed record StoredSourceDocumentFile(
    string OriginalFileName,
    string RelativePath,
    string FullPath);

public interface ISourceDocumentFileStorage
{
    long MaxPdfSizeInBytes { get; }

    Task<SourceDocumentFileValidationResult> ValidatePdfAsync(
        IFormFile file,
        CancellationToken cancellationToken = default);

    Task<StoredSourceDocumentFile> SavePdfAsync(
        IFormFile file,
        CancellationToken cancellationToken = default);

    Task<StoredSourceDocumentFile?> SavePdfEntryAsync(
        ZipArchiveEntry entry,
        CancellationToken cancellationToken = default);

    string? GetLocalFilePath(string relativePath);

    void DeleteLocalFile(string relativePath);
}

public class SourceDocumentFileStorage(IWebHostEnvironment environment) : ISourceDocumentFileStorage
{
    private const string UploadDirectory = "uploads/source-documents";

    public long MaxPdfSizeInBytes => 20 * 1024 * 1024;

    public async Task<SourceDocumentFileValidationResult> ValidatePdfAsync(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            return SourceDocumentFileValidationResult.Invalid(
                SourceDocumentFileError.EmptyFile,
                "PDF dosyası boş olamaz.");
        }

        if (file.Length > MaxPdfSizeInBytes)
        {
            return SourceDocumentFileValidationResult.Invalid(
                SourceDocumentFileError.TooLarge,
                "PDF dosyası 20 MB boyutunu aşamaz.");
        }

        if (!string.Equals(Path.GetExtension(file.FileName), ".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return SourceDocumentFileValidationResult.Invalid(
                SourceDocumentFileError.InvalidExtension,
                "Yalnızca PDF dosyası yüklenebilir.");
        }

        if (!string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return SourceDocumentFileValidationResult.Invalid(
                SourceDocumentFileError.InvalidContentType,
                "Dosya tipi application/pdf olmalıdır.");
        }

        await using var stream = file.OpenReadStream();
        var signature = new byte[5];
        var bytesRead = await stream.ReadAsync(signature, cancellationToken);
        var header = System.Text.Encoding.ASCII.GetString(signature, 0, bytesRead);

        return header == "%PDF-"
            ? SourceDocumentFileValidationResult.Valid()
            : SourceDocumentFileValidationResult.Invalid(
                SourceDocumentFileError.InvalidSignature,
                "Geçersiz PDF dosyası.");
    }

    public async Task<StoredSourceDocumentFile> SavePdfAsync(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var uploadRoot = GetUploadRoot();
        Directory.CreateDirectory(uploadRoot);

        var originalFileName = Path.GetFileName(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}.pdf";
        var fullPath = Path.Combine(uploadRoot, storedFileName);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream, cancellationToken);

        return new StoredSourceDocumentFile(
            originalFileName,
            $"/{UploadDirectory}/{storedFileName}",
            fullPath);
    }

    public async Task<StoredSourceDocumentFile?> SavePdfEntryAsync(
        ZipArchiveEntry entry,
        CancellationToken cancellationToken = default)
    {
        var uploadRoot = GetUploadRoot();
        Directory.CreateDirectory(uploadRoot);

        await using var entryStream = entry.Open();
        var signature = new byte[5];
        var bytesRead = await entryStream.ReadAsync(signature, cancellationToken);
        var header = System.Text.Encoding.ASCII.GetString(signature, 0, bytesRead);
        if (header != "%PDF-")
        {
            return null;
        }

        var originalFileName = Path.GetFileName(entry.Name);
        var storedFileName = $"{Guid.NewGuid():N}.pdf";
        var fullPath = Path.Combine(uploadRoot, storedFileName);

        await using var fileStream = File.Create(fullPath);
        await fileStream.WriteAsync(signature.AsMemory(0, bytesRead), cancellationToken);
        await entryStream.CopyToAsync(fileStream, cancellationToken);

        return new StoredSourceDocumentFile(
            originalFileName,
            $"/{UploadDirectory}/{storedFileName}",
            fullPath);
    }

    public string? GetLocalFilePath(string relativePath)
    {
        if (!relativePath.StartsWith($"/{UploadDirectory}/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var uploadRoot = Path.GetFullPath(GetUploadRoot());
        var fileName = Path.GetFileName(relativePath);
        var fullPath = Path.GetFullPath(Path.Combine(uploadRoot, fileName));

        return fullPath.StartsWith(uploadRoot, StringComparison.OrdinalIgnoreCase) ? fullPath : null;
    }

    public void DeleteLocalFile(string relativePath)
    {
        var filePath = GetLocalFilePath(relativePath);

        if (filePath is not null && File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    private string GetUploadRoot()
    {
        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        return Path.Combine(webRoot, UploadDirectory.Replace('/', Path.DirectorySeparatorChar));
    }
}
