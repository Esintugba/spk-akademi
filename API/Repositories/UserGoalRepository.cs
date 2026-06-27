using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IUserGoalRepository
{
    Task<List<UserGoal>> GetByUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<UserGoal?> GetByIdAsync(string userId, Guid goalId, CancellationToken cancellationToken = default);

    Task<int> GetQuestionCountAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    Task<int> GetStudyMinutesAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    Task<int> GetCompletedTopicsAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    Task<int> GetCompletedCoursesAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    Task<int> GetTrialExamCountAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    Task<int> GetReviewCountAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    void Add(UserGoal goal);

    void Remove(UserGoal goal);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class UserGoalRepository(DataContext context) : IUserGoalRepository
{
    private static readonly StudyStatus[] CompletedStudyStatuses =
    [
        StudyStatus.Studied,
        StudyStatus.Mastered
    ];

    public Task<List<UserGoal>> GetByUserAsync(string userId, CancellationToken cancellationToken = default) =>
        context.UserGoals
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Status)
            .ThenBy(x => x.TargetDate)
            .ToListAsync(cancellationToken);

    public Task<UserGoal?> GetByIdAsync(string userId, Guid goalId, CancellationToken cancellationToken = default) =>
        context.UserGoals.FirstOrDefaultAsync(x => x.UserId == userId && x.Id == goalId, cancellationToken);

    public async Task<int> GetQuestionCountAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        var total = await context.QuizAttempts
            .Where(x => x.UserId == userId
                && x.Status == QuizAttemptStatus.Completed
                && x.FinishedAt != null
                && x.FinishedAt >= startDate
                && x.FinishedAt <= endDate)
            .SumAsync(x => (int?)x.TotalQuestions, cancellationToken);

        return total ?? 0;
    }

    public async Task<int> GetStudyMinutesAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        var questionCount = await GetQuestionCountAsync(userId, startDate, endDate, cancellationToken);
        var planMinutes = await context.AdaptiveStudyTasks
            .Where(x => x.Plan != null
                && x.Plan.UserId == userId
                && x.Completed
                && x.CompletedAt != null
                && x.CompletedAt >= startDate
                && x.CompletedAt <= endDate)
            .SumAsync(x => (int?)x.ActualMinutes, cancellationToken);

        return (int)Math.Round(questionCount * 1.5m, MidpointRounding.AwayFromZero) + (planMinutes ?? 0);
    }

    public Task<int> GetCompletedTopicsAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default) =>
        context.StudyProgresses
            .CountAsync(x => x.UserId == userId
                && CompletedStudyStatuses.Contains(x.Status)
                && x.LastStudiedAt != null
                && x.LastStudiedAt >= startDate
                && x.LastStudiedAt <= endDate,
                cancellationToken);

    public async Task<int> GetCompletedCoursesAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        var courses = await context.Courses
            .AsNoTracking()
            .Select(course => new
            {
                course.Id,
                TopicCount = course.Topics.Count,
                CompletedTopicCount = course.Topics.Count(topic =>
                    context.StudyProgresses.Any(progress =>
                        progress.UserId == userId
                        && progress.TopicId == topic.Id
                        && CompletedStudyStatuses.Contains(progress.Status))),
                LastCompletedAt = course.Topics
                    .SelectMany(topic => context.StudyProgresses
                        .Where(progress =>
                            progress.UserId == userId
                            && progress.TopicId == topic.Id
                            && CompletedStudyStatuses.Contains(progress.Status))
                        .Select(progress => progress.LastStudiedAt))
                    .Max()
            })
            .Where(x => x.TopicCount > 0
                && x.TopicCount == x.CompletedTopicCount
                && x.LastCompletedAt != null
                && x.LastCompletedAt >= startDate
                && x.LastCompletedAt <= endDate)
            .CountAsync(cancellationToken);

        return courses;
    }

    public Task<int> GetTrialExamCountAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .CountAsync(x => x.UserId == userId
                && x.TrialExamId != null
                && x.Status == QuizAttemptStatus.Completed
                && x.FinishedAt != null
                && x.FinishedAt >= startDate
                && x.FinishedAt <= endDate,
                cancellationToken);

    public async Task<int> GetReviewCountAsync(string userId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
        =>
        await context.ReviewSessionAnswers
            .CountAsync(x =>
                x.ReviewSession != null
                && x.ReviewSession.StudentId == userId
                && x.ReviewedAt >= startDate
                && x.ReviewedAt <= endDate,
                cancellationToken);

    public void Add(UserGoal goal) => context.UserGoals.Add(goal);

    public void Remove(UserGoal goal) => context.UserGoals.Remove(goal);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
