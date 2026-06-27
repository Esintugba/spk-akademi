using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IAccessRequestRepository
{
    Task<AccessRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<AccessRequest?> GetPendingForStudentAndPlanAsync(
        string studentId,
        Guid planId,
        CancellationToken cancellationToken = default);

    Task<bool> HasBlockingRequestAsync(
        string studentId,
        Guid planId,
        CancellationToken cancellationToken = default);

    Task<List<AccessRequest>> GetByStudentAsync(
        string studentId,
        CancellationToken cancellationToken = default);

    Task<(List<AccessRequest> Items, int Total)> QueryAdminAsync(
        AccessRequestQueryDto query,
        CancellationToken cancellationToken = default);

    void Add(AccessRequest request);

    Task SaveAsync(CancellationToken cancellationToken = default);
}

public class AccessRequestRepository(DataContext context) : IAccessRequestRepository
{
    private static readonly AccessRequestStatus[] BlockingStatuses =
    [
        AccessRequestStatus.Pending,
        AccessRequestStatus.Waitlisted,
        AccessRequestStatus.Approved
    ];

    public Task<AccessRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.AccessRequests
            .Include(x => x.Student)
            .Include(x => x.Plan)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<AccessRequest?> GetPendingForStudentAndPlanAsync(
        string studentId,
        Guid planId,
        CancellationToken cancellationToken = default) =>
        context.AccessRequests
            .FirstOrDefaultAsync(x =>
                x.StudentId == studentId
                && x.PlanId == planId
                && x.Status == AccessRequestStatus.Pending,
                cancellationToken);

    public Task<bool> HasBlockingRequestAsync(
        string studentId,
        Guid planId,
        CancellationToken cancellationToken = default) =>
        context.AccessRequests
            .AsNoTracking()
            .AnyAsync(x =>
                x.StudentId == studentId
                && x.PlanId == planId
                && BlockingStatuses.Contains(x.Status),
                cancellationToken);

    public Task<List<AccessRequest>> GetByStudentAsync(
        string studentId,
        CancellationToken cancellationToken = default) =>
        context.AccessRequests
            .AsNoTracking()
            .Include(x => x.Plan)
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.RequestedAt)
            .ToListAsync(cancellationToken);

    public async Task<(List<AccessRequest> Items, int Total)> QueryAdminAsync(
        AccessRequestQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = context.AccessRequests
            .AsNoTracking()
            .Include(x => x.Student)
            .Include(x => x.Plan)
            .Include(x => x.ReviewedBy)
            .AsQueryable();

        if (query.Status.HasValue)
        {
            q = q.Where(x => x.Status == query.Status.Value);
        }

        if (query.PlanId.HasValue)
        {
            q = q.Where(x => x.PlanId == query.PlanId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.UserId))
        {
            q = q.Where(x => x.StudentId == query.UserId);
        }

        if (query.Reviewed == true)
        {
            q = q.Where(x => x.ReviewedAt != null);
        }
        else if (query.Reviewed == false)
        {
            q = q.Where(x => x.ReviewedAt == null);
        }

        if (query.RequestedFrom.HasValue)
        {
            q = q.Where(x => x.RequestedAt >= query.RequestedFrom.Value);
        }

        if (query.RequestedTo.HasValue)
        {
            q = q.Where(x => x.RequestedAt <= query.RequestedTo.Value);
        }

        var total = await q.CountAsync(cancellationToken);
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderByDescending(x => x.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public void Add(AccessRequest request) => context.AccessRequests.Add(request);

    public Task SaveAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
