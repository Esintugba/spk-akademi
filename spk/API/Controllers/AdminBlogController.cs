using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/blog")]
public class AdminBlogController(
    IBlogService blogService,
    UserManager<AppUser> userManager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BlogListResponseDto>> GetPosts(
        [FromQuery] BlogQueryDto query,
        CancellationToken cancellationToken) =>
        Ok(await blogService.GetPostsAsync(query, includeUnpublished: true, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BlogPostDetailDto>> GetPost(Guid id, CancellationToken cancellationToken)
    {
        var post = await blogService.GetAdminPostAsync(id, cancellationToken);
        return post is null ? NotFound() : Ok(post);
    }

    [HttpPost]
    public async Task<ActionResult<BlogPostDetailDto>> CreatePost(
        UpsertBlogPostDto dto,
        CancellationToken cancellationToken)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        var post = await blogService.CreatePostAsync(user.Id, dto, cancellationToken);
        return CreatedAtAction(nameof(BlogController.GetPost), "Blog", new { slug = post!.Slug }, post);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BlogPostDetailDto>> UpdatePost(
        Guid id,
        UpsertBlogPostDto dto,
        CancellationToken cancellationToken)
    {
        var post = await blogService.UpdatePostAsync(id, dto, cancellationToken);
        return post is null ? NotFound() : Ok(post);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePost(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await blogService.DeletePostAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
