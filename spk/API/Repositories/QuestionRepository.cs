using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IQuestionRepository
{
    Task<IReadOnlyList<Question>> GetQuestionsAsync(
        Guid? topicId,
        ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default);

    Task<Question?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Question?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> TopicExistsAsync(Guid topicId, CancellationToken cancellationToken = default);

    Task<bool> IsSubTopicAsync(Guid topicId, CancellationToken cancellationToken = default);

    Task AddAsync(Question question, CancellationToken cancellationToken = default);

    void RemoveOptions(IEnumerable<QuestionOption> options);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class QuestionRepository(DataContext context) : IQuestionRepository
{
    public async Task<IReadOnlyList<Question>> GetQuestionsAsync(
        Guid? topicId,
        ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default)
    {
        var query = context.Questions
            .AsNoTracking()
            .Include(x => x.Options)
            .Include(x => x.ReviewedBy)
            .AsQueryable();

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId.Value);
        }

        if (reviewStatus.HasValue)
        {
            query = query.Where(x => x.ReviewStatus == reviewStatus.Value);
        }

        return await query
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Question?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Questions
            .AsNoTracking()
            .Include(x => x.Options)
            .Include(x => x.ReviewedBy)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Question?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Questions
            .Include(x => x.Options)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> TopicExistsAsync(Guid topicId, CancellationToken cancellationToken = default) =>
        context.Topics.AnyAsync(x => x.Id == topicId, cancellationToken);

    public Task<bool> IsSubTopicAsync(Guid topicId, CancellationToken cancellationToken = default) =>
        context.Topics.AnyAsync(
            x => x.Id == topicId && (x.Type == TopicType.SubTopic || x.ParentTopicId.HasValue),
            cancellationToken);

    public async Task AddAsync(Question question, CancellationToken cancellationToken = default) =>
        await context.Questions.AddAsync(question, cancellationToken);

    public void RemoveOptions(IEnumerable<QuestionOption> options) =>
        context.QuestionOptions.RemoveRange(options);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
