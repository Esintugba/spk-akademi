using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IStandardQuizStrategy
{
    Task<IReadOnlyList<Question>> SelectQuestionsAsync(
        string userId,
        AppUser? user,
        StartQuizDto request,
        CancellationToken cancellationToken = default);
}

public interface ICoursePracticeStrategy
{
    Task<IReadOnlyList<Question>> SelectQuestionsAsync(
        string userId,
        StartCoursePracticeQuizRequestDto request,
        int questionCount,
        CancellationToken cancellationToken = default);
}

public sealed class PastExamStrategyResult
{
    public bool InvalidTopics { get; init; }

    public int AvailableQuestionCount { get; init; }

    public IReadOnlyList<Question> Questions { get; init; } = [];
}

public interface IPastExamStrategy
{
    Task<PastExamStrategyResult> SelectQuestionsAsync(
        string studentId,
        StartPastExamQuizRequestDto request,
        int questionCount,
        CancellationToken cancellationToken = default);
}

public sealed class WrongAnswersStrategyResult
{
    public int AvailableQuestionCount { get; init; }

    public IReadOnlyList<Question> Questions { get; init; } = [];
}

public interface IWrongAnswersStrategy
{
    Task<WrongAnswersStrategyResult> SelectQuestionsAsync(
        string studentId,
        StartWrongAnswersQuizRequestDto request,
        int questionCount,
        DateTime now,
        CancellationToken cancellationToken = default);
}

public class StandardQuizStrategy(
    IQuizAttemptRepository attempts,
    ILicenseAccessService accessService,
    IContentReviewQueryService contentReviewQuery,
    DataContext context) : IStandardQuizStrategy
{
    public async Task<IReadOnlyList<Question>> SelectQuestionsAsync(
        string userId,
        AppUser? user,
        StartQuizDto request,
        CancellationToken cancellationToken = default)
    {
        var query = contentReviewQuery.ApplyQuestionVisibility(attempts.QueryQuestions(), user)
            .AsNoTracking()
            .AsQueryable();

        var accessibleLicenseIds = await accessService.GetAccessibleLicenseIds(userId);
        query = query.Where(x => x.Topic != null && accessibleLicenseIds.Contains(x.Topic.Course!.LicenseId));

        if (request.TopicId.HasValue)
        {
            var topicScopeIds = await context.Topics
                .AsNoTracking()
                .Where(x => x.Id == request.TopicId.Value || x.ParentTopicId == request.TopicId.Value)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            query = query.Where(x => topicScopeIds.Contains(x.TopicId));
        }
        else if (request.CourseId.HasValue)
        {
            query = query.Where(x => x.Topic != null && x.Topic.CourseId == request.CourseId.Value);
        }

        var selectedQuestionIds = await SelectRandomQuestionIdsAsync(
            query.Select(x => x.Id),
            request.QuestionCount,
            cancellationToken);

        if (selectedQuestionIds.Count == 0)
        {
            return [];
        }

        var selectedQuestionRows = await attempts.GetQuestionsWithOptionsAsync(selectedQuestionIds, cancellationToken);
        var selectedQuestionsById = selectedQuestionRows.ToDictionary(x => x.Id);

        return selectedQuestionIds
            .Where(selectedQuestionsById.ContainsKey)
            .Select(questionId => selectedQuestionsById[questionId])
            .ToList();
    }

    private static async Task<List<Guid>> SelectRandomQuestionIdsAsync(
        IQueryable<Guid> questionIdsQuery,
        int requestedCount,
        CancellationToken cancellationToken)
    {
        var totalCount = await questionIdsQuery.CountAsync(cancellationToken);
        if (totalCount == 0)
        {
            return [];
        }

        var targetCount = Math.Min(requestedCount, totalCount);
        var orderedIds = questionIdsQuery.OrderBy(id => id);

        if (totalCount <= targetCount * 4)
        {
            var smallPool = await orderedIds.ToListAsync(cancellationToken);
            return smallPool
                .OrderBy(_ => Random.Shared.Next())
                .Take(targetCount)
                .ToList();
        }

        var selectedIds = new List<Guid>(targetCount);
        var selectedSet = new HashSet<Guid>();
        var batchSize = Math.Clamp(targetCount, 10, 50);
        var maxAttempts = targetCount * 10;
        var attemptsCount = 0;

        while (selectedIds.Count < targetCount && attemptsCount < maxAttempts)
        {
            attemptsCount++;
            var remaining = targetCount - selectedIds.Count;
            var take = Math.Min(batchSize, remaining);
            var skip = Random.Shared.Next(0, totalCount);

            var candidates = await orderedIds
                .Skip(skip)
                .Take(take)
                .ToListAsync(cancellationToken);

            foreach (var candidate in candidates)
            {
                if (selectedSet.Add(candidate))
                {
                    selectedIds.Add(candidate);
                }

                if (selectedIds.Count == targetCount)
                {
                    break;
                }
            }
        }

        if (selectedIds.Count < targetCount)
        {
            var fallbackIds = await orderedIds
                .Where(id => !selectedSet.Contains(id))
                .Take(targetCount - selectedIds.Count)
                .ToListAsync(cancellationToken);

            selectedIds.AddRange(fallbackIds);
        }

        return selectedIds;
    }
}

public class CoursePracticeStrategy(ICoursePracticeRepository coursePracticeRepository) : ICoursePracticeStrategy
{
    public async Task<IReadOnlyList<Question>> SelectQuestionsAsync(
        string userId,
        StartCoursePracticeQuizRequestDto request,
        int questionCount,
        CancellationToken cancellationToken = default)
    {
        var pool = await coursePracticeRepository.GetQuestionPoolAsync(
            request.CourseId,
            request.TopicIds,
            request.DifficultyLevels,
            cancellationToken);

        IReadOnlyList<Guid> wrongIds = [];
        if (request.IncludeWrongAnswered)
        {
            wrongIds = await coursePracticeRepository.GetWrongQuestionIdsForCourseAsync(
                userId,
                request.CourseId,
                cancellationToken);
        }

        return SelectQuestionsBalanced(pool, wrongIds, questionCount, request.RandomizeQuestions);
    }

    private static List<Question> SelectQuestionsBalanced(
        IReadOnlyList<Question> pool,
        IReadOnlyList<Guid> wrongQuestionIds,
        int take,
        bool randomize)
    {
        var wrongSet = wrongQuestionIds.ToHashSet();
        var wrongPool = pool.Where(x => wrongSet.Contains(x.Id)).ToList();
        var otherPool = pool.Where(x => !wrongSet.Contains(x.Id)).ToList();

        var selected = new List<Question>();
        var usedIds = new HashSet<Guid>();

        var wrongTarget = Math.Min(wrongPool.Count, Math.Max(1, take / 3));
        if (wrongPool.Count > 0)
        {
            PickFromPool(wrongPool, wrongTarget, selected, usedIds, randomize);
        }

        var remaining = take - selected.Count;
        if (remaining > 0)
        {
            var balancedPool = otherPool.Count > 0 ? otherPool : pool.Where(x => !usedIds.Contains(x.Id)).ToList();
            PickBalancedByTopic(balancedPool, remaining, selected, usedIds, randomize);
        }

        if (selected.Count < take)
        {
            var filler = pool.Where(x => !usedIds.Contains(x.Id)).ToList();
            PickFromPool(filler, take - selected.Count, selected, usedIds, randomize);
        }

        return randomize
            ? selected.OrderBy(_ => Random.Shared.Next()).ToList()
            : selected;
    }

    private static void PickBalancedByTopic(
        List<Question> pool,
        int count,
        List<Question> selected,
        HashSet<Guid> usedIds,
        bool randomize)
    {
        var targetTotal = selected.Count + count;
        var topicQueues = pool
            .Where(x => !usedIds.Contains(x.Id))
            .GroupBy(x => x.TopicId)
            .Select(g => new Queue<Question>(g.OrderBy(_ => randomize ? Random.Shared.Next() : 0)))
            .OrderBy(_ => randomize ? Random.Shared.Next() : 0)
            .ToList();

        while (selected.Count < targetTotal && topicQueues.Any(q => q.Count > 0))
        {
            foreach (var queue in topicQueues)
            {
                if (selected.Count >= targetTotal || queue.Count == 0)
                {
                    continue;
                }

                var question = queue.Dequeue();
                if (usedIds.Add(question.Id))
                {
                    selected.Add(question);
                }
            }
        }
    }

    private static void PickFromPool(
        List<Question> pool,
        int count,
        List<Question> selected,
        HashSet<Guid> usedIds,
        bool randomize)
    {
        var candidates = pool.Where(x => !usedIds.Contains(x.Id)).ToList();
        if (randomize)
        {
            candidates = candidates.OrderBy(_ => Random.Shared.Next()).ToList();
        }

        foreach (var question in candidates.Take(count))
        {
            if (usedIds.Add(question.Id))
            {
                selected.Add(question);
            }
        }
    }
}

public class PastExamStrategy(
    DataContext context,
    ILicenseAccessService licenseAccessService) : IPastExamStrategy
{
    public async Task<PastExamStrategyResult> SelectQuestionsAsync(
        string studentId,
        StartPastExamQuizRequestDto request,
        int questionCount,
        CancellationToken cancellationToken = default)
    {
        if (request.TopicIds is { Count: > 0 })
        {
            var validTopicIds = await context.Topics
                .AsNoTracking()
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            if (request.TopicIds.Any(id => !validTopicIds.Contains(id)))
            {
                return new PastExamStrategyResult { InvalidTopics = true };
            }
        }

        var accessibleLicenseIds = (await licenseAccessService.GetAccessibleLicenseIds(studentId))
            .ToHashSet();

        var query = context.Questions
            .AsNoTracking()
            .Include(x => x.Topic)
                .ThenInclude(x => x!.Course)
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                x.IsPastExamQuestion &&
                x.Topic != null &&
                x.Topic.Course != null &&
                accessibleLicenseIds.Contains(x.Topic.Course.LicenseId))
            .AsQueryable();

        if (request.ExamTypes is { Count: > 0 })
        {
            query = query.Where(x => x.ExamType != null && request.ExamTypes.Contains(x.ExamType.Value));
        }

        if (request.Years is { Count: > 0 })
        {
            query = query.Where(x => x.ExamYear != null && request.Years.Contains(x.ExamYear.Value));
        }

        if (request.Session.HasValue)
        {
            query = query.Where(x => x.ExamSession == request.Session);
        }

        if (request.TopicIds is { Count: > 0 })
        {
            var topicScopeIds = await ExpandTopicScopeAsync(request.TopicIds, cancellationToken);
            query = query.Where(x => topicScopeIds.Contains(x.TopicId));
        }

        if (request.Difficulty.HasValue)
        {
            query = query.Where(x => x.Difficulty == request.Difficulty.Value);
        }

        var pool = await query.ToListAsync(cancellationToken);
        return new PastExamStrategyResult
        {
            AvailableQuestionCount = pool.Count,
            Questions = SelectBalanced(pool, questionCount, request.MixedYears)
        };
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

    private static List<Question> SelectBalanced(IReadOnlyList<Question> pool, int take, bool mixedYears)
    {
        take = Math.Min(take, pool.Count);
        var selected = new List<Question>(capacity: take);
        var used = new HashSet<Guid>();

        var maxPerExamGroup = Math.Max(3, (int)Math.Ceiling(take * 0.35m));
        var yearGroups = pool
            .Where(x => x.ExamYear.HasValue)
            .GroupBy(x => x.ExamYear!.Value)
            .OrderByDescending(x => x.Key)
            .ToList();

        var yearOrder = mixedYears
            ? yearGroups.OrderBy(_ => Random.Shared.Next()).ToList()
            : yearGroups.ToList();

        var yearTargets = DistributeTargets(yearOrder.Select(g => g.Count()).ToList(), take);

        for (var i = 0; i < yearOrder.Count && selected.Count < take; i++)
        {
            var yearPool = yearOrder[i].ToList();
            var yearTake = Math.Min(yearTargets[i], take - selected.Count);
            PickWithExamCapAndTopicBalance(yearPool, yearTake, maxPerExamGroup, selected, used);
        }

        if (selected.Count < take)
        {
            PickWithExamCapAndTopicBalance(pool.ToList(), take - selected.Count, maxPerExamGroup, selected, used);
        }

        return selected.OrderBy(_ => Random.Shared.Next()).ToList();
    }

    private static void PickWithExamCapAndTopicBalance(
        List<Question> candidates,
        int count,
        int maxPerExamGroup,
        List<Question> selected,
        HashSet<Guid> usedIds)
    {
        var examCounts = selected
            .GroupBy(x => new { x.ExamType, x.ExamYear, x.ExamSession })
            .ToDictionary(x => x.Key, x => x.Count());
        var topicCounts = selected.GroupBy(x => x.TopicId).ToDictionary(x => x.Key, x => x.Count());
        var pool = candidates.Where(x => !usedIds.Contains(x.Id)).OrderBy(_ => Random.Shared.Next()).ToList();

        while (count > 0 && pool.Count > 0)
        {
            pool.Sort((a, b) =>
            {
                var aTopic = topicCounts.GetValueOrDefault(a.TopicId, 0);
                var bTopic = topicCounts.GetValueOrDefault(b.TopicId, 0);
                if (aTopic != bTopic) return aTopic.CompareTo(bTopic);

                var aKey = new { a.ExamType, a.ExamYear, a.ExamSession };
                var bKey = new { b.ExamType, b.ExamYear, b.ExamSession };
                var aExam = examCounts.GetValueOrDefault(aKey, 0);
                var bExam = examCounts.GetValueOrDefault(bKey, 0);
                return aExam != bExam ? aExam.CompareTo(bExam) : 0;
            });

            var pickedIndex = pool.FindIndex(q =>
            {
                var key = new { q.ExamType, q.ExamYear, q.ExamSession };
                return examCounts.GetValueOrDefault(key, 0) < maxPerExamGroup;
            });

            if (pickedIndex < 0) pickedIndex = 0;

            var picked = pool[pickedIndex];
            pool.RemoveAt(pickedIndex);
            if (!usedIds.Add(picked.Id)) continue;

            selected.Add(picked);
            count--;
            var examKey = new { picked.ExamType, picked.ExamYear, picked.ExamSession };
            examCounts[examKey] = examCounts.GetValueOrDefault(examKey, 0) + 1;
            topicCounts[picked.TopicId] = topicCounts.GetValueOrDefault(picked.TopicId, 0) + 1;
        }
    }

    private static List<int> DistributeTargets(IReadOnlyList<int> availableCounts, int total)
    {
        var targets = Enumerable.Repeat(0, availableCounts.Count).ToList();
        if (availableCounts.Count == 0 || total <= 0) return targets;

        var remaining = total;
        while (remaining > 0)
        {
            var progressed = false;
            for (var i = 0; i < availableCounts.Count && remaining > 0; i++)
            {
                if (targets[i] < availableCounts[i])
                {
                    targets[i]++;
                    remaining--;
                    progressed = true;
                }
            }

            if (!progressed) break;
        }

        return targets;
    }
}

public class WrongAnswersStrategy(
    IWrongAnswerQueueRepository queueRepository,
    ILicenseAccessService licenseAccessService,
    DataContext context) : IWrongAnswersStrategy
{
    public async Task<WrongAnswersStrategyResult> SelectQuestionsAsync(
        string studentId,
        StartWrongAnswersQuizRequestDto request,
        int questionCount,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        var dueItems = await queueRepository.GetDueItemsAsync(studentId, now, cancellationToken);
        var accessibleLicenseIds = (await licenseAccessService.GetAccessibleLicenseIds(studentId)).ToHashSet();
        var topicScopeIds = request.TopicId.HasValue
            ? await ExpandTopicScopeAsync(request.TopicId.Value, cancellationToken)
            : null;

        var eligibleQuestions = dueItems
            .Where(x => x.Question is not null &&
                        !x.Question.IsDeleted &&
                        x.Question.ReviewStatus == ReviewStatus.Approved &&
                        x.Question.Topic?.Course != null &&
                        accessibleLicenseIds.Contains(x.Question.Topic.Course.LicenseId))
            .Where(x => topicScopeIds is null || topicScopeIds.Contains(x.Question!.TopicId))
            .Where(x => !request.CourseId.HasValue || x.Question!.Topic!.CourseId == request.CourseId.Value)
            .Where(x => !request.Difficulty.HasValue || x.Question!.Difficulty == request.Difficulty.Value)
            .Select(x => x.Question!)
            .DistinctBy(x => x.Id)
            .ToList();

        return new WrongAnswersStrategyResult
        {
            AvailableQuestionCount = eligibleQuestions.Count,
            Questions = ShuffleWithoutConsecutiveDuplicates(eligibleQuestions, questionCount)
        };
    }

    private async Task<HashSet<Guid>> ExpandTopicScopeAsync(
        Guid topicId,
        CancellationToken cancellationToken)
    {
        var topicIds = await context.Topics
            .AsNoTracking()
            .Where(x => x.Id == topicId || x.ParentTopicId == topicId)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        return topicIds.ToHashSet();
    }

    private static List<Question> ShuffleWithoutConsecutiveDuplicates(List<Question> source, int take)
    {
        var pool = source.OrderBy(_ => Random.Shared.Next()).ToList();
        var result = new List<Question>();
        var lastId = Guid.Empty;

        while (result.Count < take && pool.Count > 0)
        {
            var candidateIndex = pool.FindIndex(x => x.Id != lastId);
            if (candidateIndex < 0)
            {
                candidateIndex = 0;
            }

            var picked = pool[candidateIndex];
            pool.RemoveAt(candidateIndex);
            result.Add(picked);
            lastId = picked.Id;
        }

        return result;
    }
}
