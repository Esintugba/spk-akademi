using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum BadgeManagementError
{
    None,
    NotFound,
    DuplicateName,
    InvalidInput,
    InUse
}

public sealed class BadgeManagementOutcome<T>
{
    public BadgeManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static BadgeManagementOutcome<T> Success(T result) =>
        new() { Error = BadgeManagementError.None, Result = result };

    public static BadgeManagementOutcome<T> Fail(BadgeManagementError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IBadgeManagementService
{
    Task<IReadOnlyList<BadgeDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<BadgeManagementOutcome<BadgeDto>> CreateAsync(UpsertBadgeDto dto, CancellationToken cancellationToken = default);

    Task<BadgeManagementOutcome<BadgeDto>> UpdateAsync(Guid id, UpsertBadgeDto dto, CancellationToken cancellationToken = default);

    Task<BadgeManagementOutcome<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class BadgeManagementService(DataContext context) : IBadgeManagementService
{
    public async Task<IReadOnlyList<BadgeDto>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await context.Badges
            .AsNoTracking()
            .OrderBy(x => x.Category)
            .ThenBy(x => x.RequirementType)
            .ThenBy(x => x.RequirementValue)
            .Select(x => ToDto(x))
            .ToListAsync(cancellationToken);

    public async Task<BadgeManagementOutcome<BadgeDto>> CreateAsync(
        UpsertBadgeDto dto,
        CancellationToken cancellationToken = default)
    {
        var validationError = Validate(dto);
        if (validationError is not null)
        {
            return BadgeManagementOutcome<BadgeDto>.Fail(BadgeManagementError.InvalidInput, validationError);
        }

        var name = dto.Name.Trim();
        if (await context.Badges.AnyAsync(x => x.Name == name, cancellationToken))
        {
            return BadgeManagementOutcome<BadgeDto>.Fail(BadgeManagementError.DuplicateName, "Bu isimde bir rozet zaten var.");
        }

        var badge = new Badge();
        Apply(badge, dto);
        await context.Badges.AddAsync(badge, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return BadgeManagementOutcome<BadgeDto>.Success(ToDto(badge));
    }

    public async Task<BadgeManagementOutcome<BadgeDto>> UpdateAsync(
        Guid id,
        UpsertBadgeDto dto,
        CancellationToken cancellationToken = default)
    {
        var validationError = Validate(dto);
        if (validationError is not null)
        {
            return BadgeManagementOutcome<BadgeDto>.Fail(BadgeManagementError.InvalidInput, validationError);
        }

        var badge = await context.Badges.FindAsync([id], cancellationToken);
        if (badge is null)
        {
            return BadgeManagementOutcome<BadgeDto>.Fail(BadgeManagementError.NotFound, "Rozet bulunamadi.");
        }

        var name = dto.Name.Trim();
        if (await context.Badges.AnyAsync(x => x.Id != id && x.Name == name, cancellationToken))
        {
            return BadgeManagementOutcome<BadgeDto>.Fail(BadgeManagementError.DuplicateName, "Bu isimde bir rozet zaten var.");
        }

        Apply(badge, dto);
        badge.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        return BadgeManagementOutcome<BadgeDto>.Success(ToDto(badge));
    }

    public async Task<BadgeManagementOutcome<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var badge = await context.Badges.FindAsync([id], cancellationToken);
        if (badge is null)
        {
            return BadgeManagementOutcome<bool>.Fail(BadgeManagementError.NotFound, "Rozet bulunamadi.");
        }

        if (await context.UserBadges.AnyAsync(x => x.BadgeId == id, cancellationToken))
        {
            return BadgeManagementOutcome<bool>.Fail(
                BadgeManagementError.InUse,
                "Bu rozet kullanıcılar tarafından kazanıldiği için silinemez. Gizli yapabilir veya koşullarını güncelleyebilirsiniz.");
        }

        context.Badges.Remove(badge);
        await context.SaveChangesAsync(cancellationToken);
        return BadgeManagementOutcome<bool>.Success(true);
    }

    private static void Apply(Badge badge, UpsertBadgeDto dto)
    {
        badge.Name = dto.Name.Trim();
        badge.Description = dto.Description.Trim();
        badge.IconUrl = dto.IconUrl.Trim();
        badge.XPReward = dto.XpReward;
        badge.Category = dto.Category;
        badge.RequirementType = dto.RequirementType;
        badge.RequirementValue = dto.RequirementValue;
        badge.IsHidden = dto.IsHidden;
    }

    private static string? Validate(UpsertBadgeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Trim().Length < 3)
        {
            return "Rozet adı en az 3 karakter olmalıdır.";
        }

        if (string.IsNullOrWhiteSpace(dto.Description) || dto.Description.Trim().Length < 10)
        {
            return "Rozet açıklaması en az 10 karakter olmalıdır.";
        }

        if (string.IsNullOrWhiteSpace(dto.IconUrl))
        {
            return "Rozet ikon yolu zorunludur.";
        }

        if (dto.XpReward < 0)
        {
            return "XP odulu negatif olamaz.";
        }

        if (dto.RequirementValue < 1)
        {
            return "Koşul değeri en az 1 olmalıdır.";
        }

        if (!Enum.IsDefined(dto.Category))
        {
            return "Geçersiz rozet kategorisi.";
        }

        if (!Enum.IsDefined(dto.RequirementType))
        {
            return "Geçersiz rozet koşul tipi.";
        }

        return null;
    }

    private static BadgeDto ToDto(Badge badge) =>
        new(
            badge.Id,
            badge.Name,
            badge.Description,
            badge.IconUrl,
            badge.XPReward,
            badge.Category,
            badge.RequirementType,
            badge.RequirementValue,
            badge.IsHidden);
}
