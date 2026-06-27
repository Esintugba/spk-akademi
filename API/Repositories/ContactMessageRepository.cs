using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IContactMessageRepository
{
    Task<ContactMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ContactMessage?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<ContactMessage> Items, int TotalCount, int UnreadCount)> QueryAdminAsync(
        ContactMessageQueryDto query,
        CancellationToken cancellationToken = default);

    Task<int> CountRecentByIpAsync(string? ipAddress, DateTime since, CancellationToken cancellationToken = default);

    Task<bool> HasRecentDuplicateAsync(
        string email,
        string subject,
        string message,
        DateTime since,
        CancellationToken cancellationToken = default);

    Task AddAsync(ContactMessage message, CancellationToken cancellationToken = default);

    Task SaveAsync(CancellationToken cancellationToken = default);
}

public class ContactMessageRepository(DataContext context) : IContactMessageRepository
{
    public Task<ContactMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.ContactMessages
            .AsNoTracking()
            .Include(x => x.AssignedToUser)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<ContactMessage?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.ContactMessages
            .Include(x => x.AssignedToUser)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<ContactMessage> Items, int TotalCount, int UnreadCount)> QueryAdminAsync(
        ContactMessageQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = context.ContactMessages
            .AsNoTracking()
            .Include(x => x.AssignedToUser)
            .AsQueryable();

        if (query.Status.HasValue)
        {
            q = q.Where(x => x.Status == query.Status.Value);
        }

        if (query.UnreadOnly == true)
        {
            q = q.Where(x => x.ReadAt == null && x.Status == ContactMessageStatus.Pending);
        }

        if (query.CreatedFrom.HasValue)
        {
            q = q.Where(x => x.CreatedAt >= query.CreatedFrom.Value);
        }

        if (query.CreatedTo.HasValue)
        {
            q = q.Where(x => x.CreatedAt <= query.CreatedTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Email))
        {
            var email = query.Email.Trim().ToLowerInvariant();
            q = q.Where(x => x.Email.ToLower().Contains(email));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            q = q.Where(x =>
                x.Name.ToLower().Contains(search)
                || x.Email.ToLower().Contains(search)
                || x.Subject.ToLower().Contains(search)
                || x.Message.ToLower().Contains(search));
        }

        var totalCount = await q.CountAsync(cancellationToken);
        var unreadCount = await context.ContactMessages
            .AsNoTracking()
            .CountAsync(x => x.ReadAt == null && x.Status == ContactMessageStatus.Pending, cancellationToken);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var items = await q
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount, unreadCount);
    }

    public Task<int> CountRecentByIpAsync(string? ipAddress, DateTime since, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ipAddress))
        {
            return Task.FromResult(0);
        }

        return context.ContactMessages
            .AsNoTracking()
            .CountAsync(x => x.IpAddress == ipAddress && x.CreatedAt >= since, cancellationToken);
    }

    public Task<bool> HasRecentDuplicateAsync(
        string email,
        string subject,
        string message,
        DateTime since,
        CancellationToken cancellationToken = default) =>
        context.ContactMessages
            .AsNoTracking()
            .AnyAsync(
                x => x.Email == email
                    && x.Subject == subject
                    && x.Message == message
                    && x.CreatedAt >= since
                    && x.Status != ContactMessageStatus.Spam,
                cancellationToken);

    public Task AddAsync(ContactMessage message, CancellationToken cancellationToken = default) =>
        context.ContactMessages.AddAsync(message, cancellationToken).AsTask();

    public Task SaveAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
