using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public interface IBadgeService
{
    Task<IReadOnlyList<UserBadgeDto>> GetBadgesAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserBadge>> EvaluateAndUnlockAsync(string userId, CancellationToken cancellationToken = default);

    Task SeedDefaultsAsync(CancellationToken cancellationToken = default);
}

public class BadgeService(
    DataContext context,
    IBadgeRepository badgeRepository,
    IXPService xpService) : IBadgeService
{
    private static readonly StudyStatus[] CompletedStudyStatuses =
    [
        StudyStatus.Studied,
        StudyStatus.Mastered
    ];

    public async Task<IReadOnlyList<UserBadgeDto>> GetBadgesAsync(string userId, CancellationToken cancellationToken = default)
    {
        await EvaluateAndUnlockAsync(userId, cancellationToken);

        var badges = GetCanonicalBadges(await badgeRepository.GetAllAsync(cancellationToken));
        var userBadges = await badgeRepository.GetUserBadgesAsync(userId, cancellationToken);
        var unlockedByBadgeId = userBadges.ToDictionary(x => x.BadgeId);
        var unlockedByBadgeKey = userBadges
            .Where(x => x.Badge is not null)
            .GroupBy(GetBadgeKey)
            .ToDictionary(x => x.Key, x => x.OrderByDescending(userBadge => userBadge.UnlockedAt).First());
        var progressByRequirementType = await ResolveProgressValuesAsync(userId, badges, cancellationToken);
        var result = new List<UserBadgeDto>(badges.Count);

        foreach (var badge in badges)
        {
            unlockedByBadgeId.TryGetValue(badge.Id, out var unlocked);
            unlocked ??= unlockedByBadgeKey.GetValueOrDefault(GetBadgeKey(badge));
            var progress = unlocked?.Progress ?? progressByRequirementType.GetValueOrDefault(badge.RequirementType);
            result.Add(new UserBadgeDto(
                badge.Id,
                badge.Name,
                badge.Description,
                badge.IconUrl,
                badge.XPReward,
                badge.Category,
                badge.RequirementType,
                badge.IsHidden,
                unlocked is not null,
                unlocked?.UnlockedAt,
                Math.Min(progress, badge.RequirementValue),
                badge.RequirementValue));
        }

        return result;
    }

    public async Task<IReadOnlyList<UserBadge>> EvaluateAndUnlockAsync(string userId, CancellationToken cancellationToken = default)
    {
        var badges = GetCanonicalBadges(await badgeRepository.GetAllAsync(cancellationToken));
        var userBadges = await badgeRepository.GetUserBadgesAsync(userId, cancellationToken);
        var unlockedBadgeIds = userBadges.Select(x => x.BadgeId).ToHashSet();
        var unlockedBadgeKeys = userBadges
            .Where(x => x.Badge is not null)
            .Select(GetBadgeKey)
            .ToHashSet();
        var progressByRequirementType = await ResolveProgressValuesAsync(userId, badges, cancellationToken);
        var unlocked = new List<UserBadge>();

        foreach (var badge in badges)
        {
            if (unlockedBadgeIds.Contains(badge.Id) || unlockedBadgeKeys.Contains(GetBadgeKey(badge)))
            {
                continue;
            }

            var progress = progressByRequirementType.GetValueOrDefault(badge.RequirementType);
            if (progress < badge.RequirementValue)
            {
                continue;
            }

            var userBadge = new UserBadge
            {
                UserId = userId,
                BadgeId = badge.Id,
                Progress = progress,
                UnlockedAt = DateTime.UtcNow
            };

            await badgeRepository.AddUserBadgeAsync(userBadge, cancellationToken);
            try
            {
                await badgeRepository.SaveChangesAsync(cancellationToken);
                userBadge.Badge = badge;
                unlockedBadgeIds.Add(badge.Id);
                unlockedBadgeKeys.Add(GetBadgeKey(badge));
                unlocked.Add(userBadge);
            }
            catch (DbUpdateException ex) when (IsUserBadgeUniqueConflict(ex))
            {
                context.Entry(userBadge).State = EntityState.Detached;
            }
        }

        foreach (var userBadge in unlocked)
        {
            if (userBadge.Badge is null || userBadge.Badge.XPReward <= 0)
            {
                continue;
            }

            await xpService.AwardXpAsync(
                userId,
                userBadge.Badge.XPReward,
                $"Rozet: {userBadge.Badge.Name}",
                "BadgeUnlock",
                userBadge.BadgeId.ToString(),
                cancellationToken);
        }

        return unlocked;
    }

    public async Task SeedDefaultsAsync(CancellationToken cancellationToken = default)
    {
        var defaults = CreateDefaultBadges();
        var iconUrls = defaults.Select(x => x.IconUrl).ToList();
        var existingBadges = await context.Badges
            .Where(x => iconUrls.Contains(x.IconUrl))
            .ToListAsync(cancellationToken);
        var existingByIconUrl = existingBadges
            .GroupBy(x => x.IconUrl)
            .ToDictionary(x => x.Key, x => x.OrderBy(badge => badge.CreatedAt).First());
        var defaultNames = defaults.Select(x => x.Name).ToList();
        var existingByName = await context.Badges
            .Where(x => defaultNames.Contains(x.Name))
            .ToListAsync(cancellationToken);
        var existingByDefaultName = existingByName
            .GroupBy(x => x.Name)
            .ToDictionary(x => x.Key, x => x.OrderBy(badge => badge.CreatedAt).First());

        foreach (var badge in defaults)
        {
            var hasExistingByName = existingByDefaultName.TryGetValue(badge.Name, out var existingByNameMatch);
            var hasExistingByIcon = existingByIconUrl.TryGetValue(badge.IconUrl, out var existingByIconMatch);
            var existing = hasExistingByName
                ? existingByNameMatch
                : hasExistingByIcon
                    ? existingByIconMatch
                    : null;

            if (existing is null)
            {
                await context.Badges.AddAsync(badge, cancellationToken);
                continue;
            }

            existing.Name = badge.Name;
            existing.Description = badge.Description;
            existing.IconUrl = badge.IconUrl;
            existing.XPReward = badge.XPReward;
            existing.Category = badge.Category;
            existing.RequirementType = badge.RequirementType;
            existing.RequirementValue = badge.RequirementValue;
            existing.IsHidden = badge.IsHidden;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<BadgeRequirementType, int>> ResolveProgressValuesAsync(
        string userId,
        IReadOnlyCollection<Badge> badges,
        CancellationToken cancellationToken)
    {
        var requirementTypes = badges.Select(x => x.RequirementType).Distinct().ToHashSet();
        var result = new Dictionary<BadgeRequirementType, int>();

        foreach (var requirementType in requirementTypes)
        {
            result[requirementType] = await ResolveProgressValueAsync(userId, requirementType, cancellationToken);
        }

        return result;
    }

    private static IReadOnlyList<Badge> GetCanonicalBadges(IReadOnlyList<Badge> badges)
    {
        var defaultNameByIconUrl = CreateDefaultBadges()
            .GroupBy(x => x.IconUrl)
            .ToDictionary(x => x.Key, x => x.First().Name);

        return badges
            .GroupBy(GetBadgeKey)
            .Select(group =>
            {
                defaultNameByIconUrl.TryGetValue(group.Key, out var defaultName);

                return group
                    .OrderByDescending(badge => defaultName is not null && badge.Name == defaultName)
                    .ThenBy(badge => badge.CreatedAt)
                    .First();
            })
            .OrderBy(x => x.Category)
            .ThenBy(x => x.RequirementValue)
            .ToList();
    }

    private static string GetBadgeKey(Badge badge) =>
        string.IsNullOrWhiteSpace(badge.IconUrl)
            ? $"{badge.RequirementType}:{badge.RequirementValue}:{badge.Category}"
            : badge.IconUrl;

    private static string GetBadgeKey(UserBadge userBadge) =>
        userBadge.Badge is null
            ? userBadge.BadgeId.ToString()
            : GetBadgeKey(userBadge.Badge);

    private async Task<int> ResolveProgressValueAsync(
        string userId,
        BadgeRequirementType requirementType,
        CancellationToken cancellationToken)
    {
        return requirementType switch
        {
            BadgeRequirementType.QuizCount => await context.QuizAttempts
                .AsNoTracking()
                .CountAsync(x => x.UserId == userId && x.FinishedAt.HasValue && x.Status == QuizAttemptStatus.Completed, cancellationToken),
            BadgeRequirementType.StreakDays => await context.UserGamificationProfiles
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => x.CurrentStreak)
                .FirstOrDefaultAsync(cancellationToken),
            BadgeRequirementType.PerfectQuizCount => await context.QuizAttempts
                .AsNoTracking()
                .CountAsync(
                    x => x.UserId == userId
                        && x.FinishedAt.HasValue
                        && x.Status == QuizAttemptStatus.Completed
                        && x.TotalQuestions > 0
                        && x.CorrectCount == x.TotalQuestions,
                    cancellationToken),
            BadgeRequirementType.LateNightStudyCount => await CountLateNightStudiesAsync(userId, cancellationToken),
            BadgeRequirementType.ReviewQuestionCount => await context.ReviewSessionAnswers
                .AsNoTracking()
                .CountAsync(x => x.ReviewSession != null && x.ReviewSession.StudentId == userId, cancellationToken),
            BadgeRequirementType.TotalXp => await context.UserGamificationProfiles
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => x.TotalXP)
                .FirstOrDefaultAsync(cancellationToken),
            BadgeRequirementType.DailyGoalCompletionCount => await context.UserDailyGoals
                .AsNoTracking()
                .CountAsync(x => x.UserId == userId && x.Completed, cancellationToken),
            BadgeRequirementType.TopicCompletionCount => await context.StudyProgresses
                .AsNoTracking()
                .CountAsync(x => x.UserId == userId && CompletedStudyStatuses.Contains(x.Status), cancellationToken),
            BadgeRequirementType.CourseCompletionCount => await CountCompletedCoursesAsync(userId, cancellationToken),
            _ => 0
        };
    }

    private async Task<int> CountCompletedCoursesAsync(string userId, CancellationToken cancellationToken)
    {
        var completedCourses = await context.Courses
            .AsNoTracking()
            .Select(course => new
            {
                TopicCount = course.Topics.Count,
                CompletedTopicCount = course.Topics.Count(topic => context.StudyProgresses.Any(progress =>
                    progress.UserId == userId
                    && progress.TopicId == topic.Id
                    && CompletedStudyStatuses.Contains(progress.Status)))
            })
            .CountAsync(x => x.TopicCount > 0 && x.TopicCount == x.CompletedTopicCount, cancellationToken);

        return completedCourses;
    }

    private async Task<int> CountLateNightStudiesAsync(string userId, CancellationToken cancellationToken)
    {
        var timeZone = TryResolveTurkeyTimeZone();
        var completions = await context.QuizAttempts
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.FinishedAt.HasValue && x.Status == QuizAttemptStatus.Completed)
            .Select(x => x.FinishedAt!.Value)
            .ToListAsync(cancellationToken);

        return completions.Count(completedAt =>
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(completedAt, timeZone);
            return local.Hour < 5;
        });
    }

    private static TimeZoneInfo TryResolveTurkeyTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
        }
        catch
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
            }
            catch
            {
                return TimeZoneInfo.Utc;
            }
        }
    }

    private static bool IsUserBadgeUniqueConflict(DbUpdateException exception)
    {
        var message = exception.InnerException?.Message ?? exception.Message;
        return message.Contains("IX_UserBadges_UserId_BadgeId", StringComparison.OrdinalIgnoreCase)
            || (message.Contains("UNIQUE constraint failed", StringComparison.OrdinalIgnoreCase)
                && message.Contains("UserBadges", StringComparison.OrdinalIgnoreCase));
    }

    private static IReadOnlyList<Badge> CreateDefaultBadges() =>
    [
        new Badge
        {
            Name = "İlk Adım",
            Description = "İlk quiz tamamlandığında açılır.",
            IconUrl = "/icons/badges/first-step.svg",
            XPReward = 20,
            Category = BadgeCategory.Practice,
            RequirementType = BadgeRequirementType.QuizCount,
            RequirementValue = 1
        },
        new Badge
        {
            Name = "Isınma Turu",
            Description = "10 quizi tamamla.",
            IconUrl = "/icons/badges/quiz-bronze.svg",
            XPReward = 40,
            Category = BadgeCategory.Practice,
            RequirementType = BadgeRequirementType.QuizCount,
            RequirementValue = 10
        },
        new Badge
        {
            Name = "Soru Maratoncusu",
            Description = "50 quizi tamamla.",
            IconUrl = "/icons/badges/quiz-silver.svg",
            XPReward = 90,
            Category = BadgeCategory.Practice,
            RequirementType = BadgeRequirementType.QuizCount,
            RequirementValue = 50
        },
        new Badge
        {
            Name = "Quiz Ustası",
            Description = "100 quizi tamamla.",
            IconUrl = "/icons/badges/quiz-gold.svg",
            XPReward = 160,
            Category = BadgeCategory.Practice,
            RequirementType = BadgeRequirementType.QuizCount,
            RequirementValue = 100
        },
        new Badge
        {
            Name = "Seri Başlangıcı",
            Description = "3 günlük çalışma serisini tamamla.",
            IconUrl = "/icons/badges/streak-starter.svg",
            XPReward = 25,
            Category = BadgeCategory.Streak,
            RequirementType = BadgeRequirementType.StreakDays,
            RequirementValue = 3
        },
        new Badge
        {
            Name = "Seri Uzmanı",
            Description = "7 günlük çalışma serisini tamamla.",
            IconUrl = "/icons/badges/streak-master.svg",
            XPReward = 40,
            Category = BadgeCategory.Streak,
            RequirementType = BadgeRequirementType.StreakDays,
            RequirementValue = 7
        },
        new Badge
        {
            Name = "Ay Boyu Disiplin",
            Description = "30 günlük çalışma serisini tamamla.",
            IconUrl = "/icons/badges/streak-legend.svg",
            XPReward = 180,
            Category = BadgeCategory.Streak,
            RequirementType = BadgeRequirementType.StreakDays,
            RequirementValue = 30,
            IsHidden = true
        },
        new Badge
        {
            Name = "Mükemmeliyetçi",
            Description = "Bir quizi yüzde yüz doğrulukla bitir.",
            IconUrl = "/icons/badges/perfectionist.svg",
            XPReward = 50,
            Category = BadgeCategory.Accuracy,
            RequirementType = BadgeRequirementType.PerfectQuizCount,
            RequirementValue = 1
        },
        new Badge
        {
            Name = "Hatasız Seri",
            Description = "5 quizi yüzde yüz doğrulukla bitir.",
            IconUrl = "/icons/badges/perfect-five.svg",
            XPReward = 120,
            Category = BadgeCategory.Accuracy,
            RequirementType = BadgeRequirementType.PerfectQuizCount,
            RequirementValue = 5
        },
        new Badge
        {
            Name = "Gece Çalışanı",
            Description = "Gece yarısı sonrasında quiz tamamla.",
            IconUrl = "/icons/badges/night-owl.svg",
            XPReward = 30,
            Category = BadgeCategory.Speed,
            RequirementType = BadgeRequirementType.LateNightStudyCount,
            RequirementValue = 1
        },
        new Badge
        {
            Name = "Gece Mesaisi",
            Description = "10 gece çalışması tamamla.",
            IconUrl = "/icons/badges/night-shift.svg",
            XPReward = 100,
            Category = BadgeCategory.Speed,
            RequirementType = BadgeRequirementType.LateNightStudyCount,
            RequirementValue = 10
        },
        new Badge
        {
            Name = "Tekrar Ritmi",
            Description = "25 tekrar sorusunu tamamla.",
            IconUrl = "/icons/badges/review-rhythm.svg",
            XPReward = 35,
            Category = BadgeCategory.Review,
            RequirementType = BadgeRequirementType.ReviewQuestionCount,
            RequirementValue = 25
        },
        new Badge
        {
            Name = "Tekrar Ustası",
            Description = "100 tekrar sorusunu tamamla.",
            IconUrl = "/icons/badges/review-master.svg",
            XPReward = 60,
            Category = BadgeCategory.Review,
            RequirementType = BadgeRequirementType.ReviewQuestionCount,
            RequirementValue = 100
        },
        new Badge
        {
            Name = "Kalıcı Hafıza",
            Description = "250 tekrar sorusunu tamamla.",
            IconUrl = "/icons/badges/review-legend.svg",
            XPReward = 150,
            Category = BadgeCategory.Review,
            RequirementType = BadgeRequirementType.ReviewQuestionCount,
            RequirementValue = 250
        },
        new Badge
        {
            Name = "XP Toplayıcı",
            Description = "500 toplam XP'ye ulaş.",
            IconUrl = "/icons/badges/xp-collector.svg",
            XPReward = 50,
            Category = BadgeCategory.Practice,
            RequirementType = BadgeRequirementType.TotalXp,
            RequirementValue = 500
        },
        new Badge
        {
            Name = "Seviye Avcısı",
            Description = "2000 toplam XP'ye ulaş.",
            IconUrl = "/icons/badges/xp-hunter.svg",
            XPReward = 140,
            Category = BadgeCategory.Practice,
            RequirementType = BadgeRequirementType.TotalXp,
            RequirementValue = 2000
        },
        new Badge
        {
            Name = "Görev Disiplini",
            Description = "7 günlük hedef tamamla.",
            IconUrl = "/icons/badges/goal-week.svg",
            XPReward = 70,
            Category = BadgeCategory.Streak,
            RequirementType = BadgeRequirementType.DailyGoalCompletionCount,
            RequirementValue = 7
        },
        new Badge
        {
            Name = "Görev Rutini",
            Description = "30 günlük hedef tamamla.",
            IconUrl = "/icons/badges/goal-month.svg",
            XPReward = 160,
            Category = BadgeCategory.Streak,
            RequirementType = BadgeRequirementType.DailyGoalCompletionCount,
            RequirementValue = 30
        },
        new Badge
        {
            Name = "Konu Fatihi",
            Description = "5 konuyu çalışılmış veya uzman seviyesine getir.",
            IconUrl = "/icons/badges/topic-conqueror.svg",
            XPReward = 80,
            Category = BadgeCategory.CourseCompletion,
            RequirementType = BadgeRequirementType.TopicCompletionCount,
            RequirementValue = 5
        },
        new Badge
        {
            Name = "Ders Bitirici",
            Description = "Bir dersin tüm konularını tamamla.",
            IconUrl = "/icons/badges/course-finisher.svg",
            XPReward = 140,
            Category = BadgeCategory.CourseCompletion,
            RequirementType = BadgeRequirementType.CourseCompletionCount,
            RequirementValue = 1
        }
    ];
}
