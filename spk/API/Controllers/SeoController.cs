using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[AllowAnonymous]
public class SeoController(
    ISitemapService sitemapService,
    IRobotsService robotsService) : ControllerBase
{
    [HttpGet("robots.txt")]
    [Produces("text/plain")]
    public IActionResult GetRobots()
    {
        Response.Headers.CacheControl = "public, max-age=1800";
        return Content(robotsService.GenerateRobotsTxt(), "text/plain; charset=utf-8");
    }

    [HttpGet("sitemap.xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap(CancellationToken cancellationToken)
    {
        var xml = await sitemapService.GenerateSitemapAsync(cancellationToken);
        Response.Headers.CacheControl = "public, max-age=1800";
        return Content(xml, "application/xml; charset=utf-8");
    }

    [HttpGet("api/public/seo/{slug}")]
    public async Task<ActionResult<SeoMetadataDto>> GetMetadata(
        string slug,
        CancellationToken cancellationToken)
    {
        var metadata = await sitemapService.GetMetadataAsync(slug, cancellationToken);
        return metadata is null ? NotFound() : Ok(metadata);
    }
}
