using API.Entities;

namespace API.Dtos;

public record BlogCategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    int DisplayOrder,
    int PostCount);

public record BlogTagDto(
    Guid Id,
    string Name,
    string Slug,
    int PostCount);

public record BlogPostListItemDto(
    Guid Id,
    string Title,
    string Slug,
    string Summary,
    string? CoverImageUrl,
    BlogCategoryDto? Category,
    string? AuthorName,
    BlogPostStatus Status,
    DateTime? PublishedAt,
    int ReadingTime,
    int ViewCount,
    IReadOnlyList<BlogTagDto> Tags);

public record BlogPostDetailDto(
    Guid Id,
    string Title,
    string Slug,
    string Summary,
    string Content,
    string? CoverImageUrl,
    BlogCategoryDto? Category,
    string? AuthorName,
    BlogPostStatus Status,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string MetaTitle,
    string MetaDescription,
    string CanonicalUrl,
    int ReadingTime,
    int ViewCount,
    IReadOnlyList<BlogTagDto> Tags,
    IReadOnlyList<BlogPostListItemDto> RelatedPosts);

public record BlogListResponseDto(
    IReadOnlyList<BlogPostListItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);

public record BlogQueryDto(
    string? Search,
    string? CategorySlug,
    string? TagSlug,
    int Page = 1,
    int PageSize = 12);

public record UpsertBlogPostDto(
    string Title,
    string? Slug,
    string Summary,
    string Content,
    string? CoverImageUrl,
    Guid? CategoryId,
    BlogPostStatus Status,
    DateTime? PublishedAt,
    string? MetaTitle,
    string? MetaDescription,
    string? CanonicalUrl,
    IReadOnlyList<string>? Tags);

public record UpsertBlogCategoryDto(
    string Name,
    string? Slug,
    string? Description,
    int DisplayOrder);
