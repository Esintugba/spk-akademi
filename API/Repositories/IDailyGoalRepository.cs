using API.Entities;

namespace API.Repositories;

public interface IDailyGoalRepository
{
    Task<IReadOnlyList<DailyGoal>> GetGoalsForDateAsync(DateOnly activeDate, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserDailyGoal>> GetUserGoalsForDateAsync(
        string userId,
        DateOnly activeDate,
        CancellationToken cancellationToken = default);

    Task<int> CountCompletedGoalsAsync(string userId, CancellationToken cancellationToken = default);

    Task AddGoalsAsync(IEnumerable<DailyGoal> goals, CancellationToken cancellationToken = default);

    Task AddUserGoalsAsync(IEnumerable<UserDailyGoal> userGoals, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
