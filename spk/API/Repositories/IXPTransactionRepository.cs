using API.Entities;

namespace API.Repositories;

public interface IXPTransactionRepository
{
    Task<int> GetDailyEarnedXpAsync(string userId, DateTime utcDate, CancellationToken cancellationToken = default);

    Task<bool> HasReferenceAwardedAsync(
        string userId,
        string referenceType,
        string? referenceId,
        CancellationToken cancellationToken = default);

    Task AddAsync(XPTransaction transaction, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<XPTransaction> Items, int TotalCount)> GetPagedAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
