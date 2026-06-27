using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum TopicManagementError
{
    None,
    Unauthorized,
    Forbidden,
    NotFound,
    InvalidCourse,
    InvalidParent,
    InvalidType,
    DuplicateSlug,
    HasSubTopics
}

public sealed class TopicManagementOutcome<T>
{
    public TopicManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static TopicManagementOutcome<T> Success(T result) =>
        new() { Error = TopicManagementError.None, Result = result };

    public static TopicManagementOutcome<T> Fail(TopicManagementError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface ITopicManagementService
{
    Task<TopicManagementOutcome<IReadOnlyList<TopicDto>>> GetTopicsAsync(
        string? userId,
        Guid? courseId,
        CancellationToken cancellationToken = default);

    Task<TopicManagementOutcome<TopicDto>> GetTopicAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<TopicManagementOutcome<TopicDto>> CreateTopicAsync(
        CreateTopicDto dto,
        CancellationToken cancellationToken = default);

    Task<TopicManagementOutcome<bool>> UpdateTopicAsync(
        Guid id,
        UpdateTopicDto dto,
        CancellationToken cancellationToken = default);

    Task<TopicManagementOutcome<bool>> DeleteTopicAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class TopicManagementService(
    ITopicRepository topics,
    ILicenseAccessService accessService,
    ILicenseCatalogCache licenseCatalogCache,
    ISeoCache seoCache) : ITopicManagementService
{
    public async Task<TopicManagementOutcome<IReadOnlyList<TopicDto>>> GetTopicsAsync(
        string? userId,
        Guid? courseId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return TopicManagementOutcome<IReadOnlyList<TopicDto>>.Fail(TopicManagementError.Unauthorized);
        }

        var accessibleLicenseIds = await accessService.GetAccessibleLicenseIds(userId);
        var result = await topics.GetTopicsAsync(accessibleLicenseIds, courseId, cancellationToken);

        return TopicManagementOutcome<IReadOnlyList<TopicDto>>.Success(result);
    }

    public async Task<TopicManagementOutcome<TopicDto>> GetTopicAsync(
        string? userId,
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return TopicManagementOutcome<TopicDto>.Fail(TopicManagementError.Unauthorized);
        }

        if (!await accessService.CanAccessTopic(userId, id))
        {
            return TopicManagementOutcome<TopicDto>.Fail(TopicManagementError.Forbidden);
        }

        var topic = await topics.GetTopicDtoAsync(id, cancellationToken);
        return topic is null
            ? TopicManagementOutcome<TopicDto>.Fail(TopicManagementError.NotFound)
            : TopicManagementOutcome<TopicDto>.Success(topic);
    }

    public async Task<TopicManagementOutcome<TopicDto>> CreateTopicAsync(
        CreateTopicDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!await topics.CourseExistsAsync(dto.CourseId, cancellationToken))
        {
            return TopicManagementOutcome<TopicDto>.Fail(
                TopicManagementError.InvalidCourse,
                "CourseId gecersiz.");
        }

        var slug = dto.Slug.Trim();
        if (await topics.SlugExistsAsync(dto.CourseId, slug, cancellationToken: cancellationToken))
        {
            return TopicManagementOutcome<TopicDto>.Fail(
                TopicManagementError.DuplicateSlug,
                "Bu kısa kod bu derste zaten kullanılıyor.");
        }

        var topicType = ResolveTopicType(dto.Type, dto.ParentTopicId);
        var parentValidation = await ValidateParentTopicAsync(
            topicId: null,
            dto.CourseId,
            dto.ParentTopicId,
            topicType,
            cancellationToken);
        if (parentValidation is not null)
        {
            return TopicManagementOutcome<TopicDto>.Fail(parentValidation.Value.Error, parentValidation.Value.Message);
        }

        var topic = new Topic
        {
            CourseId = dto.CourseId,
            ParentTopicId = dto.ParentTopicId,
            Type = topicType,
            Title = dto.Title,
            Slug = slug,
            Order = dto.Order,
            Summary = dto.Summary,
            ImportantPoints = dto.ImportantPoints,
            CommonMistakes = dto.CommonMistakes,
            Formulas = dto.Formulas,
            ExamNotes = dto.ExamNotes,
            CriticalThresholds = dto.CriticalThresholds
        };

        await topics.AddAsync(topic, cancellationToken);
        await topics.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return TopicManagementOutcome<TopicDto>.Success(ToDto(topic, questionCount: 0));
    }

    public async Task<TopicManagementOutcome<bool>> UpdateTopicAsync(
        Guid id,
        UpdateTopicDto dto,
        CancellationToken cancellationToken = default)
    {
        var topic = await topics.GetByIdAsync(id, cancellationToken);
        if (topic is null)
        {
            return TopicManagementOutcome<bool>.Fail(TopicManagementError.NotFound);
        }

        if (!await topics.CourseExistsAsync(dto.CourseId, cancellationToken))
        {
            return TopicManagementOutcome<bool>.Fail(
                TopicManagementError.InvalidCourse,
                "CourseId gecersiz.");
        }

        var slug = dto.Slug.Trim();
        if (await topics.SlugExistsAsync(dto.CourseId, slug, id, cancellationToken))
        {
            return TopicManagementOutcome<bool>.Fail(
                TopicManagementError.DuplicateSlug,
                "Bu kısa kod bu derste zaten kullanılıyor.");
        }

        var topicType = ResolveTopicType(dto.Type, dto.ParentTopicId);
        if (topicType == TopicType.SubTopic && await topics.HasSubTopicsAsync(id, cancellationToken))
        {
            return TopicManagementOutcome<bool>.Fail(
                TopicManagementError.InvalidType,
                "Alt konusu olan bir ana konu alt konuya donusturulemez.");
        }

        var parentValidation = await ValidateParentTopicAsync(
            id,
            dto.CourseId,
            dto.ParentTopicId,
            topicType,
            cancellationToken);
        if (parentValidation is not null)
        {
            return TopicManagementOutcome<bool>.Fail(parentValidation.Value.Error, parentValidation.Value.Message);
        }

        topic.CourseId = dto.CourseId;
        topic.ParentTopicId = dto.ParentTopicId;
        topic.Type = topicType;
        topic.Title = dto.Title;
        topic.Slug = slug;
        topic.Order = dto.Order;
        topic.Summary = dto.Summary;
        topic.ImportantPoints = dto.ImportantPoints;
        topic.CommonMistakes = dto.CommonMistakes;
        topic.Formulas = dto.Formulas;
        topic.ExamNotes = dto.ExamNotes;
        topic.CriticalThresholds = dto.CriticalThresholds;
        topic.UpdatedAt = DateTime.UtcNow;

        await topics.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return TopicManagementOutcome<bool>.Success(true);
    }

    public async Task<TopicManagementOutcome<bool>> DeleteTopicAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var topic = await topics.GetByIdAsync(id, cancellationToken);
        if (topic is null)
        {
            return TopicManagementOutcome<bool>.Fail(TopicManagementError.NotFound);
        }

        if (await topics.HasSubTopicsAsync(id, cancellationToken))
        {
            return TopicManagementOutcome<bool>.Fail(
                TopicManagementError.HasSubTopics,
                "Alt konulari olan bir konu silinemez. Once alt konulari tasiyin veya silin.");
        }

        topics.Remove(topic);
        await topics.SaveChangesAsync(cancellationToken);
        InvalidateCaches();

        return TopicManagementOutcome<bool>.Success(true);
    }

    private void InvalidateCaches()
    {
        licenseCatalogCache.Invalidate();
        seoCache.Invalidate();
    }

    private static TopicDto ToDto(Topic topic, int questionCount) =>
        new(
            topic.Id,
            topic.CourseId,
            topic.ParentTopicId,
            null,
            topic.Type,
            topic.Title,
            topic.Slug,
            topic.Order,
            topic.ParentTopicId.HasValue ? 1 : 0,
            topic.Summary,
            topic.ImportantPoints,
            topic.CommonMistakes,
            topic.Formulas,
            topic.ExamNotes,
            topic.CriticalThresholds,
            0,
            questionCount);

    private static TopicType ResolveTopicType(TopicType? type, Guid? parentTopicId) =>
        type ?? (parentTopicId.HasValue ? TopicType.SubTopic : TopicType.MainTopic);

    private async Task<(TopicManagementError Error, string Message)?> ValidateParentTopicAsync(
        Guid? topicId,
        Guid courseId,
        Guid? parentTopicId,
        TopicType topicType,
        CancellationToken cancellationToken)
    {
        if (topicType == TopicType.MainTopic)
        {
            return parentTopicId.HasValue
                ? (TopicManagementError.InvalidParent, "Ana konu baska bir ana konuya baglanamaz.")
                : null;
        }

        if (topicType != TopicType.SubTopic)
        {
            return (TopicManagementError.InvalidType, "Konu tipi gecersiz.");
        }

        if (!parentTopicId.HasValue)
        {
            return (TopicManagementError.InvalidParent, "Alt konu icin ana konu secmelisin.");
        }

        if (topicId.HasValue && parentTopicId.Value == topicId.Value)
        {
            return (TopicManagementError.InvalidParent, "Bir konu kendi alt konusu olamaz.");
        }

        var parent = await topics.GetByIdNoTrackingAsync(parentTopicId.Value, cancellationToken);
        if (parent is null)
        {
            return (TopicManagementError.InvalidParent, "Ana konu gecersiz.");
        }

        if (parent.CourseId != courseId)
        {
            return (TopicManagementError.InvalidParent, "Alt konu ile ana konu ayni derse bagli olmali.");
        }

        if (parent.Type == TopicType.SubTopic || parent.ParentTopicId.HasValue)
        {
            return (TopicManagementError.InvalidParent, "Alt konu yalnizca bir ana konuya baglanabilir.");
        }

        var ancestorId = parent.ParentTopicId;
        var visited = new HashSet<Guid> { parent.Id };

        while (ancestorId.HasValue)
        {
            if (topicId.HasValue && ancestorId.Value == topicId.Value)
            {
                return (TopicManagementError.InvalidParent, "Konu hiyerarsisinde dongu olusamaz.");
            }

            if (!visited.Add(ancestorId.Value))
            {
                return (TopicManagementError.InvalidParent, "Konu hiyerarsisinde dongu olusamaz.");
            }

            var ancestor = await topics.GetByIdNoTrackingAsync(ancestorId.Value, cancellationToken);
            if (ancestor is null)
            {
                break;
            }

            if (ancestor.CourseId != courseId)
            {
                return (TopicManagementError.InvalidParent, "Alt konu zinciri ayni ders icinde kalmali.");
            }

            ancestorId = ancestor.ParentTopicId;
        }

        return null;
    }
}
