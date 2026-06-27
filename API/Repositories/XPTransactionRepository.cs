using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class XPTransactionRepository(DataContext context) : IXPTransactionRepository
{
    public async Task<int> GetDailyEarnedXpAsync(string userId, DateTime utcDate, CancellationToken cancellationToken = default)
    {
        var dayStart = utcDate.Date;
        var nextDay = dayStart.AddDays(1);

        return await context.XPTransactions
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.CreatedAt >= dayStart && x.CreatedAt < nextDay)
            .SumAsync(x => (int?)x.Amount, cancellationToken) ?? 0;
    }

    public Task<bool> HasReferenceAwardedAsync(
        string userId,
        string referenceType,
        string? referenceId,
        CancellationToken cancellationToken = default) =>
        context.XPTransactions.AnyAsync(
            x => x.UserId == userId && x.ReferenceType == referenceType && x.ReferenceId == referenceId,
            cancellationToken);

    public Task AddAsync(XPTransaction transaction, CancellationToken cancellationToken = default) =>
        context.XPTransactions.AddAsync(transaction, cancellationToken).AsTask();

    public async Task<(IReadOnlyList<XPTransaction> Items, int TotalCount)> GetPagedAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = context.XPTransactions
            .AsNoTracking()
            .Where(x => x.UserId == userId);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
