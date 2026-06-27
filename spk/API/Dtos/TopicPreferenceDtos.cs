namespace API.Dtos;

public record TopicPreferenceDto(
    Guid TopicId,
    bool IsFavorite,
    bool IsInWeeklyPlan,
    DateTime? UpdatedAt);

public record UpdateTopicPreferenceDto(
    bool? IsFavorite,
    bool? IsInWeeklyPlan);
