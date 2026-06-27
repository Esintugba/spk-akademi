using API.Dtos;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/plans")]
public class PlansController(
    IPlanCatalogService planCatalogService,
    UserManager<AppUser> userManager) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PlanDto>>> GetPlans(CancellationToken cancellationToken)
    {
        return Ok(await planCatalogService.GetCatalogAsync(userManager.GetUserId(User), cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlanDto>> GetPlan(Guid id, CancellationToken cancellationToken)
    {
        var plan = await planCatalogService.GetByIdAsync(id, userManager.GetUserId(User), cancellationToken);
        return plan is null ? NotFound() : Ok(plan);
    }
}
