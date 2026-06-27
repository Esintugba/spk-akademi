using API.Dtos;
using API.Entities;

namespace API.Repositories;

public interface IBlogRepository
{
    IQueryable<BlogPost> QueryPosts(bool includeUnpublished = false);

    Task<BlogPost?> GetPostByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<BlogPost?> GetPublishedPostBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, Guid? exceptId = null, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<BlogPost> Items, int TotalCount)> GetPostsAsync(
        BlogQueryDto query,
        bool includeUnpublished,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BlogCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BlogTagDto>> GetTagsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BlogPost>> GetRelatedPostsAsync(
        BlogPost post,
        int take,
        CancellationToken cancellationToken = default);

    Task<BlogCategory?> GetCategoryAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BlogTag>> GetOrCreateTagsAsync(
        IReadOnlyList<string> tagNames,
        CancellationToken cancellationToken = default);

    Task AddPostAsync(BlogPost post, CancellationToken cancellationToken = default);

    void RemovePostTags(BlogPost post);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
