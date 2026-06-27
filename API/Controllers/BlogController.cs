using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/blog")]
public class BlogController(IBlogService blogService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BlogListResponseDto>> GetPosts(
        [FromQuery] BlogQueryDto query,
        CancellationToken cancellationToken) =>
        Ok(await blogService.GetPostsAsync(query, cancellationToken: cancellationToken));

    [HttpGet("{slug}")]
    public async Task<ActionResult<BlogPostDetailDto>> GetPost(
        string slug,
        CancellationToken cancellationToken)
    {
        var post = await blogService.GetPostAsync(slug, cancellationToken);
        return post is null ? NotFound() : Ok(post);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<BlogCategoryDto>>> GetCategories(CancellationToken cancellationToken) =>
        Ok(await blogService.GetCategoriesAsync(cancellationToken));

    [HttpGet("tags")]
    public async Task<ActionResult<IReadOnlyList<BlogTagDto>>> GetTags(CancellationToken cancellationToken) =>
        Ok(await blogService.GetTagsAsync(cancellationToken));

    [HttpGet("search")]
    public async Task<ActionResult<BlogListResponseDto>> Search(
        [FromQuery] string q,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken) =>
        Ok(await blogService.GetPostsAsync(new BlogQueryDto(q, null, null, page, pageSize), cancellationToken: cancellationToken));
}
