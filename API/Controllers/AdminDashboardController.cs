using API.Dtos;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/dashboard")]
public class AdminDashboardController(IAdminDashboardService dashboardService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard(CancellationToken cancellationToken)
    {
        return Ok(await dashboardService.GetDashboardAsync(cancellationToken));
    }
}
