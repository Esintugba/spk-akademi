using API.Authorization;
using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.StudentOnly)]
[Route("api/materials")]
public class MaterialsController(
    UserManager<API.Entities.AppUser> userManager,
    IPdfViewerService pdfViewerService,
    IMaterialProgressService materialProgressService,
    IMaterialNotesService notesService,
    IMaterialBookmarksService bookmarksService) : ControllerBase
{
    [HttpGet("{id:guid}/viewer-info")]
    public async Task<ActionResult<MaterialViewerDto>> GetViewerInfo(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var dto = await pdfViewerService.GetViewerAsync(userId, id, cancellationToken);
        return dto is null ? NotFound() : Ok(dto);
    }

    // Secure PDF streaming endpoint (tokenized).
    // Example: /api/materials/{id}/viewer?token=...
    [AllowAnonymous]
    [HttpGet("{id:guid}/viewer")]
    public async Task<IActionResult> StreamViewer(Guid id, [FromQuery] string token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Unauthorized();
        }

        var (allowed, filePath, fileName, _) = await pdfViewerService.ValidateStreamTokenAsync(token, cancellationToken);
        if (!allowed || filePath is null || fileName is null)
        {
            return Unauthorized();
        }

        Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        Response.Headers.Pragma = "no-cache";
        Response.Headers.Expires = "0";
        Response.Headers.XContentTypeOptions = "nosniff";
        Response.Headers.ContentSecurityPolicy = "default-src 'none';";

        return PhysicalFile(filePath, "application/pdf", fileDownloadName: null, enableRangeProcessing: true);
    }

    [HttpPost("progress")]
    public async Task<IActionResult> SaveProgress(
        MaterialProgressDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var ok = await materialProgressService.UpsertProgressAsync(userId, dto, cancellationToken);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("reading-history")]
    public async Task<ActionResult<IReadOnlyList<ReadingHistoryItemDto>>> GetReadingHistory(
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await materialProgressService.GetReadingHistoryAsync(userId, take, cancellationToken));
    }

    [HttpGet("library")]
    public async Task<ActionResult<IReadOnlyList<MaterialLibraryItemDto>>> GetLibrary(
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await materialProgressService.GetLibraryAsync(userId, take, cancellationToken));
    }

    [HttpGet("reading-analytics")]
    public async Task<ActionResult<ReadingAnalyticsDto>> GetReadingAnalytics(
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await materialProgressService.GetReadingAnalyticsAsync(userId, cancellationToken));
    }

    [HttpGet("{id:guid}/notes")]
    public async Task<ActionResult<IReadOnlyList<MaterialNoteDto>>> GetNotes(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await notesService.GetNotesAsync(userId, id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("notes")]
    public async Task<ActionResult<IReadOnlyList<MyMaterialNoteDto>>> GetMyNotes(
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await notesService.GetAllNotesAsync(userId, take, cancellationToken));
    }

    [HttpPost("{id:guid}/notes")]
    public async Task<ActionResult<MaterialNoteDto>> CreateNote(
        Guid id,
        CreateMaterialNoteDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var created = await notesService.AddNoteAsync(userId, id, dto, cancellationToken);
        return created is null ? NotFound() : Ok(created);
    }

    [HttpPatch("notes/{noteId:guid}")]
    public async Task<IActionResult> UpdateNote(
        Guid noteId,
        UpdateMaterialNoteDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var ok = await notesService.UpdateNoteAsync(userId, noteId, dto, cancellationToken);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("notes/{noteId:guid}")]
    public async Task<IActionResult> DeleteNote(
        Guid noteId,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var ok = await notesService.DeleteNoteAsync(userId, noteId, cancellationToken);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("note-reviews")]
    public async Task<ActionResult<IReadOnlyList<ReviewMaterialNoteDto>>> GetDueNoteReviews(
        [FromQuery] int take = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        return Ok(await notesService.GetDueReviewsAsync(userId, take, cancellationToken));
    }

    [HttpPost("notes/{noteId:guid}/review")]
    public async Task<ActionResult<MaterialNoteReviewResultDto>> ReviewNote(
        Guid noteId,
        SubmitMaterialNoteReviewDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await notesService.ReviewNoteAsync(userId, noteId, dto.Quality, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/bookmarks")]
    public async Task<ActionResult<IReadOnlyList<MaterialBookmarkDto>>> GetBookmarks(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await bookmarksService.GetAsync(userId, id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/bookmarks")]
    public async Task<ActionResult<MaterialBookmarkDto>> CreateBookmark(
        Guid id,
        CreateMaterialBookmarkDto dto,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var created = await bookmarksService.AddAsync(userId, id, dto, cancellationToken);
        return created is null ? NotFound() : Ok(created);
    }

    [HttpDelete("bookmarks/{bookmarkId:guid}")]
    public async Task<IActionResult> DeleteBookmark(
        Guid bookmarkId,
        CancellationToken cancellationToken)
    {
        var userId = userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var ok = await bookmarksService.DeleteAsync(userId, bookmarkId, cancellationToken);
        return ok ? NoContent() : NotFound();
    }
}

