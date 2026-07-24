using API.Dtos;
using API.Entities;

namespace API.Services;

public sealed record QuestionImportTopicPath(
    string Course,
    string? MainTopic,
    string SubTopic)
{
    public string DisplayName =>
        string.IsNullOrWhiteSpace(MainTopic)
            ? $"{Course} / {SubTopic}"
            : $"{Course} / {MainTopic} / {SubTopic}";
}

public sealed record QuestionImportTopicResolution(
    Topic? Topic,
    QuestionImportTopicPath Path,
    string? ErrorMessage)
{
    public bool IsSuccess => Topic is not null && ErrorMessage is null;
}

public static class QuestionImportTopicResolver
{
    public static QuestionImportTopicPath GetPath(QuestionImportRowDto row)
    {
        var legacyTopic = row.Topic?.Trim();
        var explicitMainTopic = row.MainTopic?.Trim();
        var explicitSubTopic = row.SubTopic?.Trim();

        var mainTopic = !string.IsNullOrWhiteSpace(explicitMainTopic)
            ? explicitMainTopic
            : !string.IsNullOrWhiteSpace(explicitSubTopic) && !string.IsNullOrWhiteSpace(legacyTopic)
                ? legacyTopic
                : null;
        var subTopic = !string.IsNullOrWhiteSpace(explicitSubTopic)
            ? explicitSubTopic
            : legacyTopic ?? string.Empty;

        return new QuestionImportTopicPath(row.Course.Trim(), mainTopic, subTopic);
    }

    public static QuestionImportTopicResolution Resolve(
        QuestionImportRowDto row,
        IReadOnlyCollection<Topic> topics)
    {
        var path = GetPath(row);
        if (string.IsNullOrWhiteSpace(path.Course) || string.IsNullOrWhiteSpace(path.SubTopic))
        {
            return new QuestionImportTopicResolution(null, path, null);
        }

        var courseTopics = topics
            .Where(topic => string.Equals(
                topic.Course?.Name,
                path.Course,
                StringComparison.OrdinalIgnoreCase))
            .ToList();

        var subTopicCandidates = courseTopics
            .Where(topic =>
                topic.Type == TopicType.SubTopic
                && topic.ParentTopicId.HasValue
                && string.Equals(topic.Title, path.SubTopic, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!string.IsNullOrWhiteSpace(path.MainTopic))
        {
            subTopicCandidates = subTopicCandidates
                .Where(topic =>
                    topic.ParentTopic is not null
                    && topic.ParentTopic.Type == TopicType.MainTopic
                    && string.Equals(
                        topic.ParentTopic.Title,
                        path.MainTopic,
                        StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        if (subTopicCandidates.Count == 1)
        {
            return new QuestionImportTopicResolution(subTopicCandidates[0], path, null);
        }

        if (subTopicCandidates.Count > 1)
        {
            return new QuestionImportTopicResolution(
                null,
                path,
                "Alt konu eşleşmesi belirsiz. MainTopic alanını doldurarak ana konuyu belirtin.");
        }

        var pointsToMainTopic = courseTopics.Any(topic =>
            topic.Type == TopicType.MainTopic
            && string.Equals(topic.Title, path.SubTopic, StringComparison.OrdinalIgnoreCase));
        if (pointsToMainTopic)
        {
            return new QuestionImportTopicResolution(
                null,
                path,
                "Belirtilen konu bir ana konudur. Sorular yalnızca alt konulara bağlanabilir; SubTopic alanına alt konu adını yazın.");
        }

        return new QuestionImportTopicResolution(
            null,
            path,
            $"Alt konu bulunamadı veya belirtilen ana konunun altında değil: {path.DisplayName}");
    }
}
