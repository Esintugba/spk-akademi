using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public interface IUserGoalService
{
    Task<IReadOnlyList<UserGoalDto>> GetGoalsAsync(string userId, CancellationToken cancellationToken = default);

    Task<UserGoalDto?> GetGoalAsync(string userId, Guid goalId, CancellationToken cancellationToken = default);

    Task<UserGoalDto> CreateGoalAsync(string userId, CreateUserGoalDto dto, CancellationToken cancellationToken = default);

    Task<UserGoalDto?> UpdateGoalAsync(string userId, Guid goalId, UpdateUserGoalDto dto, CancellationToken cancellationToken = default);

    Task<bool> DeleteGoalAsync(string userId, Guid goalId, CancellationToken cancellationToken = default);
}

public class UserGoalService(IUserGoalRepository goals) : IUserGoalService
{
    public async Task<IReadOnlyList<UserGoalDto>> GetGoalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var items = await goals.GetByUserAsync(userId, cancellationToken);
        foreach (var goal in items)
        {
            await RefreshProgressAsync(userId, goal, cancellationToken);
        }

        await goals.SaveChangesAsync(cancellationToken);
        return items.Select(ToDto).ToList();
    }

    public async Task<UserGoalDto?> GetGoalAsync(string userId, Guid goalId, CancellationToken cancellationToken = default)
    {
        var goal = await goals.GetByIdAsync(userId, goalId, cancellationToken);
        if (goal is null)
        {
            return null;
        }

        await RefreshProgressAsync(userId, goal, cancellationToken);
        await goals.SaveChangesAsync(cancellationToken);
        return ToDto(goal);
    }

    public async Task<UserGoalDto> CreateGoalAsync(string userId, CreateUserGoalDto dto, CancellationToken cancellationToken = default)
    {
        ValidateGoal(dto.Title, dto.TargetValue, dto.StartDate, dto.TargetDate);

        var goal = new UserGoal
        {
            UserId = userId,
            Title = dto.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            GoalType = dto.GoalType,
            TargetValue = dto.TargetValue,
            StartDate = dto.StartDate.ToUniversalTime(),
            TargetDate = dto.TargetDate.ToUniversalTime(),
            Status = UserGoalStatus.Active
        };

        await RefreshProgressAsync(userId, goal, cancellationToken);
        goals.Add(goal);
        await goals.SaveChangesAsync(cancellationToken);
        return ToDto(goal);
    }

    public async Task<UserGoalDto?> UpdateGoalAsync(string userId, Guid goalId, UpdateUserGoalDto dto, CancellationToken cancellationToken = default)
    {
        ValidateGoal(dto.Title, dto.TargetValue, dto.StartDate, dto.TargetDate);

        var goal = await goals.GetByIdAsync(userId, goalId, cancellationToken);
        if (goal is null)
        {
            return null;
        }

        goal.Title = dto.Title.Trim();
        goal.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        goal.TargetValue = dto.TargetValue;
        goal.StartDate = dto.StartDate.ToUniversalTime();
        goal.TargetDate = dto.TargetDate.ToUniversalTime();
        goal.Status = dto.Status;
        goal.UpdatedAt = DateTime.UtcNow;

        if (goal.Status != UserGoalStatus.Completed)
        {
            goal.CompletedAt = null;
        }

        await RefreshProgressAsync(userId, goal, cancellationToken);
        await goals.SaveChangesAsync(cancellationToken);
        return ToDto(goal);
    }

    public async Task<bool> DeleteGoalAsync(string userId, Guid goalId, CancellationToken cancellationToken = default)
    {
        var goal = await goals.GetByIdAsync(userId, goalId, cancellationToken);
        if (goal is null)
        {
            return false;
        }

        goals.Remove(goal);
        await goals.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task RefreshProgressAsync(string userId, UserGoal goal, CancellationToken cancellationToken)
    {
        var endDate = DateTime.UtcNow < goal.TargetDate ? DateTime.UtcNow : goal.TargetDate;
        goal.CurrentValue = goal.GoalType switch
        {
            UserGoalType.QuestionCount => await goals.GetQuestionCountAsync(userId, goal.StartDate, endDate, cancellationToken),
            UserGoalType.StudyMinutes => await goals.GetStudyMinutesAsync(userId, goal.StartDate, endDate, cancellationToken),
            UserGoalType.CompletedTopics => await goals.GetCompletedTopicsAsync(userId, goal.StartDate, endDate, cancellationToken),
            UserGoalType.CompletedCourses => await goals.GetCompletedCoursesAsync(userId, goal.StartDate, endDate, cancellationToken),
            UserGoalType.TrialExamCount => await goals.GetTrialExamCountAsync(userId, goal.StartDate, endDate, cancellationToken),
            UserGoalType.ReviewCount => await goals.GetReviewCountAsync(userId, goal.StartDate, endDate, cancellationToken),
            _ => goal.CurrentValue
        };

        if (goal.Status == UserGoalStatus.Active && goal.CurrentValue >= goal.TargetValue)
        {
            goal.Status = UserGoalStatus.Completed;
            goal.CompletedAt ??= DateTime.UtcNow;
        }
    }

    private static UserGoalDto ToDto(UserGoal goal)
    {
        var progress = goal.TargetValue <= 0
            ? 0
            : Math.Min(100, Math.Round((decimal)goal.CurrentValue / goal.TargetValue * 100, 1));
        var daysRemaining = Math.Max(0, (int)Math.Ceiling((goal.TargetDate.Date - DateTime.UtcNow.Date).TotalDays));
        var isOverdue = goal.Status == UserGoalStatus.Active && goal.TargetDate < DateTime.UtcNow;

        return new UserGoalDto(
            goal.Id,
            goal.Title,
            goal.Description,
            goal.GoalType,
            goal.TargetValue,
            goal.CurrentValue,
            progress,
            goal.StartDate,
            goal.TargetDate,
            daysRemaining,
            goal.Status,
            isOverdue,
            goal.CompletedAt,
            goal.CreatedAt);
    }

    private static void ValidateGoal(string title, int targetValue, DateTime startDate, DateTime targetDate)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Hedef başlığı zorunludur.");
        }

        if (targetValue <= 0)
        {
            throw new ArgumentException("Hedef değeri sıfırdan büyük olmalıdır.");
        }

        if (targetDate <= startDate)
        {
            throw new ArgumentException("Hedef tarihi başlangıç tarihinden sonra olmalıdır.");
        }
    }
}
