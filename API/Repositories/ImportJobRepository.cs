using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IImportJobRepository
{
    Task<ImportJob?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(ImportJob job, CancellationToken cancellationToken = default);

    Task SaveAsync(CancellationToken cancellationToken = default);
}

public class ImportJobRepository(DataContext context) : IImportJobRepository
{
    public Task<ImportJob?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.ImportJobs
            .Include(x => x.Errors.OrderBy(e => e.RowNumber))
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(ImportJob job, CancellationToken cancellationToken = default) =>
        context.ImportJobs.AddAsync(job, cancellationToken).AsTask();

    public Task SaveAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
