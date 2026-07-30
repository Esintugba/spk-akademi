using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IQuestionRepository
{
    Task<IReadOnlyList<Question>> GetQuestionsAsync(
        Guid? topicId,
        ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<QuestionListItemDto> Items, int TotalCount)> GetQuestionPageAsync(
        QuestionListQueryDto query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Question?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Question?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> TopicExistsAsync(Guid topicId, CancellationToken cancellationToken = default);

    Task<bool> IsSubTopicAsync(Guid topicId, CancellationToken cancellationToken = default);

    Task AddAsync(Question question, CancellationToken cancellationToken = default);

    void AddOptions(IEnumerable<QuestionOption> options);

    void RemoveOptions(IEnumerable<QuestionOption> options);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class QuestionRepository(DataContext context) : IQuestionRepository
{
    public async Task<(IReadOnlyList<QuestionListItemDto> Items, int TotalCount)> GetQuestionPageAsync(
        QuestionListQueryDto query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var questions = context.Questions
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .AsQueryable();

        if (query.TopicId.HasValue)
        {
            questions = questions.Where(x => x.TopicId == query.TopicId.Value);
        }

        if (query.Difficulty.HasValue)
        {
            questions = questions.Where(x => x.Difficulty == query.Difficulty.Value);
        }

        if (query.ReviewStatus.HasValue)
        {
            questions = questions.Where(x => x.ReviewStatus == query.ReviewStatus.Value);
        }

        if (query.IsPastExamQuestion.HasValue)
        {
            questions = questions.Where(x => x.IsPastExamQuestion == query.IsPastExamQuestion.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            questions = questions.Where(x =>
                x.Text.Contains(term)
                || x.Explanation.Contains(term)
                || (x.SourceReference != null && x.SourceReference.Contains(term))
                || (x.Topic != null && x.Topic.Title.Contains(term)));
        }

        var totalCount = await questions.CountAsync(cancellationToken);
        var items = await questions
            .OrderByDescending(x => x.CreatedAt)
            .ThenBy(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new QuestionListItemDto(
                x.Id,
                x.TopicId,
                x.Topic != null ? x.Topic.Title : string.Empty,
                x.Text,
                x.Difficulty,
                x.Type,
                x.IsPastExamQuestion,
                x.ExamYear,
                x.ExamType,
                x.ExamSession,
                x.SourceReference,
                x.ReviewStatus,
                x.AccessLevel,
                x.Options.Count))
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<Question>> GetQuestionsAsync(
        Guid? topicId,
        ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default)
    {
        var query = context.Questions
            .AsNoTracking()
            .Include(x => x.Options)
            .Include(x => x.ReviewedBy)
            .Where(x => !x.IsDeleted)
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

    public void AddOptions(IEnumerable<QuestionOption> options) =>
        context.QuestionOptions.AddRange(options);

    public void RemoveOptions(IEnumerable<QuestionOption> options) =>
        context.QuestionOptions.RemoveRange(options);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
