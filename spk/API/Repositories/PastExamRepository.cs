using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IPastExamRepository
{
    Task<(IReadOnlyList<PastExamQuestionDto> Items, int TotalCount)> GetPastExamQuestionsAsync(
        PastExamQuestionFilterDto filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

public class PastExamRepository(DataContext context) : IPastExamRepository
{
    public async Task<(IReadOnlyList<PastExamQuestionDto> Items, int TotalCount)> GetPastExamQuestionsAsync(
        PastExamQuestionFilterDto filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = context.Questions
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted
                && x.ReviewStatus == ReviewStatus.Approved
                && x.IsPastExamQuestion
                && x.Topic != null
                && x.Topic.Course != null)
            .AsQueryable();

        if (filter.ExamTypes is { Count: > 0 })
        {
            query = query.Where(x => x.ExamType != null && filter.ExamTypes.Contains(x.ExamType.Value));
        }

        if (filter.Years is { Count: > 0 })
        {
            query = query.Where(x => x.ExamYear != null && filter.Years.Contains(x.ExamYear.Value));
        }

        if (filter.Session.HasValue)
        {
            query = query.Where(x => x.ExamSession == filter.Session);
        }

        if (filter.TopicIds is { Count: > 0 })
        {
            query = query.Where(x => filter.TopicIds.Contains(x.TopicId));
        }

        if (filter.Difficulty.HasValue)
        {
            query = query.Where(x => x.Difficulty == filter.Difficulty);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(x =>
                x.Text.Contains(term)
                || x.Explanation.Contains(term)
                || (x.SourceReference != null && x.SourceReference.Contains(term))
                || (x.Topic != null && x.Topic.Title.Contains(term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.ExamYear)
            .ThenBy(x => x.ExamType)
            .ThenBy(x => x.ExamSession)
            .ThenBy(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new PastExamQuestionDto(
                x.Id,
                x.TopicId,
                x.Topic!.Title,
                x.Text,
                x.Difficulty,
                x.Type,
                x.IsPastExamQuestion,
                x.ExamYear,
                x.ExamType,
                x.ExamSession,
                x.SourceReference))
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}

