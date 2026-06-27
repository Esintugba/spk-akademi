using System.Text;
using System.Text.Json;
using API.Configuration;
using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.DataProtection;

namespace API.Services;

public interface IPdfViewerService
{
    Task<MaterialViewerDto?> GetViewerAsync(
        string userId,
        Guid materialId,
        CancellationToken cancellationToken = default);

    Task<(bool Allowed, string? FilePath, string? FileName, string? WatermarkText)> ValidateStreamTokenAsync(
        string token,
        CancellationToken cancellationToken = default);
}

public class PdfViewerService(
    DataContext context,
    IWebHostEnvironment environment,
    ILicenseAccessService accessService,
    IDataProtectionProvider dataProtectionProvider,
    IOptions<BrandingOptions> brandingOptions) : IPdfViewerService
{
    private const string UploadDirectory = "uploads/source-documents";
    private const string ProtectorPurpose = "material-viewer-v1";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private sealed record StreamTokenPayload(
        string UserId,
        Guid MaterialId,
        DateTime ExpiresAtUtc);

    public async Task<MaterialViewerDto?> GetViewerAsync(
        string userId,
        Guid materialId,
        CancellationToken cancellationToken = default)
    {
        var material = await context.SourceDocuments
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == materialId, cancellationToken);

        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return null;
        }

        if (!await accessService.CanAccessCourse(userId, material.CourseId))
        {
            return null;
        }

        var progress = await context.UserMaterialProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.MaterialId == materialId, cancellationToken);

        var token = CreateStreamToken(userId, materialId, DateTime.UtcNow.AddMinutes(10));
        var streamUrl = $"/api/materials/{materialId}/viewer?token={Uri.EscapeDataString(token)}";
        var watermarkText = brandingOptions.Value.ApiTitle.Length > 0
            ? $"{userId} · {brandingOptions.Value.ApiTitle}"
            : userId;

        return new MaterialViewerDto(
            materialId,
            material.Title,
            material.PageCount,
            streamUrl,
            progress?.LastPage,
            progress?.ProgressPercentage,
            watermarkText);
    }

    public async Task<(bool Allowed, string? FilePath, string? FileName, string? WatermarkText)> ValidateStreamTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        StreamTokenPayload payload;
        try
        {
            payload = ReadStreamToken(token);
        }
        catch
        {
            return (false, null, null, null);
        }

        if (payload.ExpiresAtUtc < DateTime.UtcNow)
        {
            return (false, null, null, null);
        }

        var material = await context.SourceDocuments
            .AsNoTracking()
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == payload.MaterialId, cancellationToken);

        if (material is null || material.IsDeleted || material.ReviewStatus != ReviewStatus.Approved)
        {
            return (false, null, null, null);
        }

        if (!await accessService.CanAccessCourse(payload.UserId, material.CourseId))
        {
            return (false, null, null, null);
        }

        var filePath = GetLocalFilePath(material.FilePath);
        if (filePath is null || !File.Exists(filePath))
        {
            return (false, null, null, null);
        }

        var watermarkText = payload.UserId;
        return (true, filePath, material.FileName, watermarkText);
    }

    private string CreateStreamToken(string userId, Guid materialId, DateTime expiresAtUtc)
    {
        var protector = dataProtectionProvider.CreateProtector(ProtectorPurpose);
        var json = JsonSerializer.Serialize(new StreamTokenPayload(userId, materialId, expiresAtUtc), JsonOptions);
        var protectedValue = protector.Protect(json);
        var bytes = Encoding.UTF8.GetBytes(protectedValue);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    private StreamTokenPayload ReadStreamToken(string token)
    {
        var bytes = WebEncoders.Base64UrlDecode(token);
        var protectedValue = Encoding.UTF8.GetString(bytes);
        var protector = dataProtectionProvider.CreateProtector(ProtectorPurpose);
        var json = protector.Unprotect(protectedValue);
        return JsonSerializer.Deserialize<StreamTokenPayload>(json, JsonOptions)
               ?? throw new InvalidOperationException("Invalid token payload.");
    }

    private string GetUploadRoot()
    {
        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        return Path.Combine(webRoot, UploadDirectory.Replace('/', Path.DirectorySeparatorChar));
    }

    private string? GetLocalFilePath(string relativePath)
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
}

