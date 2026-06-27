using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IConsentLogRepository
{
    Task AddAsync(ConsentLog consentLog, CancellationToken cancellationToken = default);

    Task<ConsentSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class ConsentLogRepository(DataContext context) : IConsentLogRepository
{
    public async Task AddAsync(ConsentLog consentLog, CancellationToken cancellationToken = default) =>
        await context.ConsentLogs.AddAsync(consentLog, cancellationToken);

    public async Task<ConsentSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var cookieConsents = context.ConsentLogs.AsNoTracking().Where(x => x.ConsentType == "cookie");
        var kvkkConsents = context.ConsentLogs.AsNoTracking().Where(x => x.ConsentType != "cookie");

        var recent = await context.ConsentLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(30)
            .Select(x => new ConsentLogDto(
                x.Id,
                x.UserId,
                x.ConsentType,
                x.IpAddress,
                x.CreatedAt,
                x.Version,
                x.Analytics,
                x.Marketing,
                x.KvkkAccepted,
                x.CommercialElectronicMessages))
            .ToListAsync(cancellationToken);

        return new ConsentSummaryDto(
            await cookieConsents.CountAsync(x => x.Analytics || x.Marketing, cancellationToken),
            await cookieConsents.CountAsync(x => !x.Analytics && !x.Marketing, cancellationToken),
            await cookieConsents.MaxAsync(x => (DateTime?)x.CreatedAt, cancellationToken),
            await kvkkConsents.CountAsync(x => x.KvkkAccepted, cancellationToken),
            await kvkkConsents.MaxAsync(x => (DateTime?)x.CreatedAt, cancellationToken),
            recent);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
