using API.Data;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IAccessApprovalService
{
    Task GrantPlanAccessAsync(
        string studentId,
        Guid planId,
        CancellationToken cancellationToken = default);
}

public class AccessApprovalService(
    DataContext context,
    IUserLicenseAccessRepository licenseAccessRepository) : IAccessApprovalService
{
    public async Task GrantPlanAccessAsync(
        string studentId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        var licenseIds = await context.PlanLicenses
            .AsNoTracking()
            .Where(x => x.PlanId == planId)
            .Select(x => x.LicenseId)
            .ToListAsync(cancellationToken);

        foreach (var licenseId in licenseIds)
        {
            await licenseAccessRepository.GrantOrActivateAsync(
                studentId,
                licenseId,
                AccessSource.Manual,
                cancellationToken);
        }
    }
}
