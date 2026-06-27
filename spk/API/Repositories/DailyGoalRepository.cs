using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class DailyGoalRepository(DataContext context) : IDailyGoalRepository
{
    public async Task<IReadOnlyList<DailyGoal>> GetGoalsForDateAsync(DateOnly activeDate, CancellationToken cancellationToken = default) =>
        await context.DailyGoals
            .AsNoTracking()
            .Where(x => x.ActiveDate == activeDate)
            .OrderBy(x => x.GoalType)
            .ThenBy(x => x.TargetValue)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<UserDailyGoal>> GetUserGoalsForDateAsync(
        string userId,
        DateOnly activeDate,
        CancellationToken cancellationToken = default) =>
        await context.UserDailyGoals
            .Include(x => x.DailyGoal)
            .Where(x => x.UserId == userId && x.DailyGoal != null && x.DailyGoal.ActiveDate == activeDate)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<int> CountCompletedGoalsAsync(string userId, CancellationToken cancellationToken = default) =>
        context.UserDailyGoals.CountAsync(x => x.UserId == userId && x.Completed, cancellationToken);

    public async Task AddGoalsAsync(IEnumerable<DailyGoal> goals, CancellationToken cancellationToken = default) =>
        await context.DailyGoals.AddRangeAsync(goals, cancellationToken);

    public async Task AddUserGoalsAsync(IEnumerable<UserDailyGoal> userGoals, CancellationToken cancellationToken = default) =>
        await context.UserDailyGoals.AddRangeAsync(userGoals, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
