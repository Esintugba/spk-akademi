using API.Entities;
using Microsoft.AspNetCore.Http;

namespace API.Dtos;

public record SourceDocumentDto(
    Guid Id,
    Guid CourseId,
    string Title,
    string FileName,
    string FilePath,
    string SourceName,
    DateOnly? SourcePublishedAt,
    DateOnly? SourceUpdatedAt,
    int PageCount,
    DateTime? TextExtractedAt,
    ReviewStatus ReviewStatus,
    ContentAccessLevel AccessLevel,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewComment);

public record CreateSourceDocumentDto(
    Guid CourseId,
    string Title,
    string FileName,
    string FilePath,
    string SourceName,
    DateOnly? SourcePublishedAt,
    DateOnly? SourceUpdatedAt);

public record UpdateSourceDocumentDto(
    Guid CourseId,
    string Title,
    string FileName,
    string FilePath,
    string SourceName,
    DateOnly? SourcePublishedAt,
    DateOnly? SourceUpdatedAt);

public record UploadSourceDocumentDto(
    Guid CourseId,
    string Title,
    string SourceName,
    DateOnly? SourcePublishedAt,
    DateOnly? SourceUpdatedAt,
    IFormFile File);

public record SourceDocumentTextDto(
    Guid Id,
    Guid CourseId,
    string Title,
    int PageCount,
    DateTime? TextExtractedAt,
    string ExtractedText);
