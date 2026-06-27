using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class CoursePracticeRepository(DataContext context) : ICoursePracticeRepository
{
    public Task<Course?> GetCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        context.Courses
            .AsNoTracking()
            .Include(x => x.License)
            .FirstOrDefaultAsync(x => x.Id == courseId, cancellationToken);

    public async Task<IReadOnlyList<Question>> GetQuestionPoolAsync(
        Guid courseId,
        IReadOnlyList<Guid>? topicIds,
        IReadOnlyList<QuestionDifficulty>? difficultyLevels,
        CancellationToken cancellationToken = default)
    {
        var query = context.Questions
            .AsNoTracking()
            .Include(x => x.Options)
            .Include(x => x.Topic)
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                x.Topic != null &&
                x.Topic.CourseId == courseId);

        if (topicIds is { Count: > 0 })
        {
            var topicIdSet = await ExpandTopicScopeAsync(topicIds, cancellationToken);
            query = query.Where(x => topicIdSet.Contains(x.TopicId));
        }

        if (difficultyLevels is { Count: > 0 })
        {
            var difficultySet = difficultyLevels.ToHashSet();
            query = query.Where(x => difficultySet.Contains(x.Difficulty));
        }

        return await query.ToListAsync(cancellationToken);
    }

    private async Task<HashSet<Guid>> ExpandTopicScopeAsync(
        IReadOnlyList<Guid> topicIds,
        CancellationToken cancellationToken)
    {
        var selected = topicIds.ToHashSet();
        var childTopicIds = await context.Topics
            .AsNoTracking()
            .Where(x => x.ParentTopicId.HasValue && selected.Contains(x.ParentTopicId.Value))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        selected.UnionWith(childTopicIds);
        return selected;
    }

    public async Task<IReadOnlyList<Guid>> GetWrongQuestionIdsForCourseAsync(
        string userId,
        Guid courseId,
        CancellationToken cancellationToken = default)
    {
        var wrongIds = await context.WrongAnswerQueues
            .AsNoTracking()
            .Where(x => x.StudentId == userId && !x.IsMastered)
            .Select(x => x.QuestionId)
            .ToListAsync(cancellationToken);

        if (wrongIds.Count == 0)
        {
            return [];
        }

        return await context.Questions
            .AsNoTracking()
            .Where(q =>
                wrongIds.Contains(q.Id) &&
                !q.IsDeleted &&
                q.Topic != null &&
                q.Topic.CourseId == courseId)
            .Select(q => q.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CoursePracticeCourseRow>> GetAccessibleCoursesAsync(
        string userId,
        IReadOnlyList<Guid> accessibleLicenseIds,
        CancellationToken cancellationToken = default)
    {
        var licenseSet = accessibleLicenseIds.ToHashSet();

        var courses = await context.Courses
            .AsNoTracking()
            .Include(x => x.License)
            .Include(x => x.Topics)
            .Where(x => licenseSet.Contains(x.LicenseId))
            .OrderBy(x => x.License!.Name)
            .ThenBy(x => x.Order)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);

        var courseIds = courses.Select(x => x.Id).ToList();
        var topicIds = courses.SelectMany(x => x.Topics).Select(x => x.Id).ToList();

        var questionCounts = await context.Questions
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                topicIds.Contains(x.TopicId))
            .GroupBy(x => x.Topic!.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CourseId, x => x.Count, cancellationToken);

        var progressRows = await context.StudyProgresses
            .AsNoTracking()
            .Where(x => x.UserId == userId && topicIds.Contains(x.TopicId))
            .Select(x => new
            {
                x.TopicId,
                x.CorrectCount,
                x.WrongCount,
                x.LastStudiedAt
            })
            .ToListAsync(cancellationToken);

        var topicCourseMap = await context.Topics
            .AsNoTracking()
            .Where(x => topicIds.Contains(x.Id))
            .Select(x => new { x.Id, x.CourseId })
            .ToDictionaryAsync(x => x.Id, x => x.CourseId, cancellationToken);

        var progresses = progressRows
            .Where(x => topicCourseMap.ContainsKey(x.TopicId))
            .GroupBy(x => topicCourseMap[x.TopicId])
            .Select(g => new
            {
                CourseId = g.Key,
                Correct = g.Sum(x => x.CorrectCount),
                Wrong = g.Sum(x => x.WrongCount),
                StudiedTopics = g.Count(x => x.LastStudiedAt.HasValue)
            })
            .ToList();

        var progressByCourse = progresses.ToDictionary(x => x.CourseId);

        return courses.Select(course =>
        {
            progressByCourse.TryGetValue(course.Id, out var progress);
            questionCounts.TryGetValue(course.Id, out var qCount);
            var totalTopics = course.Topics.Count;

            return new CoursePracticeCourseRow
            {
                CourseId = course.Id,
                LicenseId = course.LicenseId,
                LicenseName = course.License?.Name ?? string.Empty,
                CourseName = course.Name,
                TopicCount = totalTopics,
                TotalQuestionCount = qCount,
                CorrectCount = progress?.Correct ?? 0,
                WrongCount = progress?.Wrong ?? 0,
                StudiedTopicCount = progress?.StudiedTopics ?? 0,
                TotalTopicCount = totalTopics
            };
        }).ToList();
    }
}
