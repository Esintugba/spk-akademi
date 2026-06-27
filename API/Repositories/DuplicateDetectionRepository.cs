using API.Data;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public record DuplicateQuestionCandidate(Guid Id, string Text);

public interface IDuplicateDetectionRepository
{
    Task<IReadOnlyList<DuplicateQuestionCandidate>> GetQuestionCandidatesAsync(
        CancellationToken cancellationToken = default);
}

public class DuplicateDetectionRepository(DataContext context) : IDuplicateDetectionRepository
{
    public async Task<IReadOnlyList<DuplicateQuestionCandidate>> GetQuestionCandidatesAsync(
        CancellationToken cancellationToken = default) =>
        await context.Questions
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .Select(x => new DuplicateQuestionCandidate(x.Id, x.Text))
            .ToListAsync(cancellationToken);
}
