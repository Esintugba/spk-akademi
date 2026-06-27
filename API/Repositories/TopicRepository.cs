using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface ITopicRepository
{
    Task<IReadOnlyList<TopicDto>> GetTopicsAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? courseId,
        CancellationToken cancellationToken = default);

    Task<TopicDto?> GetTopicDtoAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Topic?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Topic?> GetByIdNoTrackingAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> CourseExistsAsync(Guid courseId, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(
        Guid courseId,
        string slug,
        Guid? excludeTopicId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasSubTopicsAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(Topic topic, CancellationToken cancellationToken = default);

    void Remove(Topic topic);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class TopicRepository(DataContext context) : ITopicRepository
{
    public async Task<IReadOnlyList<TopicDto>> GetTopicsAsync(
        IReadOnlyCollection<Guid> accessibleLicenseIds,
        Guid? courseId,
        CancellationToken cancellationToken = default)
    {
        var query = context.Topics
            .AsNoTracking()
            .Where(x => x.Course != null && accessibleLicenseIds.Contains(x.Course.LicenseId));

        if (courseId.HasValue)
        {
            query = query.Where(x => x.CourseId == courseId.Value);
        }

        var rows = await query
            .Select(x => new TopicDto(
                x.Id,
                x.CourseId,
                x.ParentTopicId,
                x.ParentTopic != null ? x.ParentTopic.Title : null,
                x.Type,
                x.Title,
                x.Slug,
                x.Order,
                0,
                x.Summary,
                x.ImportantPoints,
                x.CommonMistakes,
                x.Formulas,
                x.ExamNotes,
                x.CriticalThresholds,
                x.SubTopics.Count,
                x.Questions.Count))
            .ToListAsync(cancellationToken);

        return SortTopics(rows);
    }

    public Task<TopicDto?> GetTopicDtoAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Topics
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new TopicDto(
                x.Id,
                x.CourseId,
                x.ParentTopicId,
                x.ParentTopic != null ? x.ParentTopic.Title : null,
                x.Type,
                x.Title,
                x.Slug,
                x.Order,
                x.ParentTopicId.HasValue ? 1 : 0,
                x.Summary,
                x.ImportantPoints,
                x.CommonMistakes,
                x.Formulas,
                x.ExamNotes,
                x.CriticalThresholds,
                x.SubTopics.Count,
                x.Questions.Count))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Topic?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Topics.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Topic?> GetByIdNoTrackingAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Topics.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CourseExistsAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        context.Courses.AnyAsync(x => x.Id == courseId, cancellationToken);

    public Task<bool> SlugExistsAsync(
        Guid courseId,
        string slug,
        Guid? excludeTopicId = null,
        CancellationToken cancellationToken = default) =>
        context.Topics.AnyAsync(
            x => x.CourseId == courseId &&
                 x.Slug == slug &&
                 (!excludeTopicId.HasValue || x.Id != excludeTopicId.Value),
            cancellationToken);

    public Task<bool> HasSubTopicsAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Topics.AnyAsync(x => x.ParentTopicId == id, cancellationToken);

    public async Task AddAsync(Topic topic, CancellationToken cancellationToken = default) =>
        await context.Topics.AddAsync(topic, cancellationToken);

    public void Remove(Topic topic) => context.Topics.Remove(topic);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);

    private static IReadOnlyList<TopicDto> SortTopics(IReadOnlyList<TopicDto> rows)
    {
        var byId = rows.ToDictionary(x => x.Id);
        var childrenByParent = rows
            .Where(x => x.ParentTopicId.HasValue && byId.ContainsKey(x.ParentTopicId.Value))
            .GroupBy(x => x.ParentTopicId!.Value)
            .ToDictionary(x => x.Key, x => x.OrderBy(topic => topic.Order).ThenBy(topic => topic.Title).ToList());

        var roots = rows
            .Where(x => !x.ParentTopicId.HasValue || !byId.ContainsKey(x.ParentTopicId.Value))
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Title)
            .ToList();

        var result = new List<TopicDto>(rows.Count);
        foreach (var root in roots)
        {
            AppendWithChildren(root, level: 0);
        }

        return result;

        void AppendWithChildren(TopicDto topic, int level)
        {
            result.Add(topic with { Level = level });

            if (!childrenByParent.TryGetValue(topic.Id, out var children))
            {
                return;
            }

            foreach (var child in children)
            {
                AppendWithChildren(child, level + 1);
            }
        }
    }
}
