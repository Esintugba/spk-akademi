using API.Dtos;
using API.Entities;
using API.Services;

namespace API.UnitTests.Services;

public class QuestionImportTopicResolverTests
{
    [Fact]
    public void Resolve_UsesTopicAsMainTopic_WhenSubTopicColumnIsPresent()
    {
        var (mainTopic, subTopic) = CreateTopicHierarchy(
            "Sermaye Piyasası Kanunu",
            "Sermaye Piyasasına Giriş ve Temel Kavramlar");
        var row = CreateRow(
            topic: mainTopic.Title,
            subTopic: subTopic.Title);

        var result = QuestionImportTopicResolver.Resolve(row, [mainTopic, subTopic]);

        Assert.True(result.IsSuccess);
        Assert.Equal(subTopic.Id, result.Topic!.Id);
        Assert.Equal(mainTopic.Title, result.Path.MainTopic);
    }

    [Fact]
    public void Resolve_AllowsLegacyTopic_WhenItUniquelyNamesASubTopic()
    {
        var (mainTopic, subTopic) = CreateTopicHierarchy("Ana konu", "Alt konu");
        var row = CreateRow(topic: subTopic.Title);

        var result = QuestionImportTopicResolver.Resolve(row, [mainTopic, subTopic]);

        Assert.True(result.IsSuccess);
        Assert.Equal(subTopic.Id, result.Topic!.Id);
    }

    [Fact]
    public void Resolve_RejectsLegacyTopic_WhenItNamesAMainTopic()
    {
        var (mainTopic, subTopic) = CreateTopicHierarchy("Ana konu", "Alt konu");
        var row = CreateRow(topic: mainTopic.Title);

        var result = QuestionImportTopicResolver.Resolve(row, [mainTopic, subTopic]);

        Assert.False(result.IsSuccess);
        Assert.Contains("ana konudur", result.ErrorMessage);
    }

    [Fact]
    public void Resolve_UsesMainTopicToDisambiguateDuplicateSubTopicTitles()
    {
        var (firstMain, firstSub) = CreateTopicHierarchy("Birinci ana konu", "Ortak alt konu");
        var (secondMain, secondSub) = CreateTopicHierarchy("İkinci ana konu", "Ortak alt konu");
        var row = CreateRow(
            mainTopic: secondMain.Title,
            subTopic: secondSub.Title);

        var result = QuestionImportTopicResolver.Resolve(
            row,
            [firstMain, firstSub, secondMain, secondSub]);

        Assert.True(result.IsSuccess);
        Assert.Equal(secondSub.Id, result.Topic!.Id);
    }

    [Fact]
    public void Resolve_RejectsAmbiguousSubTopicWithoutMainTopic()
    {
        var (firstMain, firstSub) = CreateTopicHierarchy("Birinci ana konu", "Ortak alt konu");
        var (secondMain, secondSub) = CreateTopicHierarchy("İkinci ana konu", "Ortak alt konu");
        var row = CreateRow(topic: "Ortak alt konu");

        var result = QuestionImportTopicResolver.Resolve(
            row,
            [firstMain, firstSub, secondMain, secondSub]);

        Assert.False(result.IsSuccess);
        Assert.Contains("belirsiz", result.ErrorMessage);
    }

    [Fact]
    public void Resolve_RejectsSubTopicUnderADifferentMainTopic()
    {
        var (mainTopic, subTopic) = CreateTopicHierarchy("Doğru ana konu", "Alt konu");
        var row = CreateRow(
            mainTopic: "Yanlış ana konu",
            subTopic: subTopic.Title);

        var result = QuestionImportTopicResolver.Resolve(row, [mainTopic, subTopic]);

        Assert.False(result.IsSuccess);
        Assert.Contains("belirtilen ana konunun altında değil", result.ErrorMessage);
    }

    private static (Topic MainTopic, Topic SubTopic) CreateTopicHierarchy(
        string mainTopicTitle,
        string subTopicTitle)
    {
        var course = new Course { Name = "Test dersi" };
        var mainTopic = new Topic
        {
            CourseId = course.Id,
            Course = course,
            Title = mainTopicTitle,
            Type = TopicType.MainTopic
        };
        var subTopic = new Topic
        {
            CourseId = course.Id,
            Course = course,
            ParentTopicId = mainTopic.Id,
            ParentTopic = mainTopic,
            Title = subTopicTitle,
            Type = TopicType.SubTopic
        };

        return (mainTopic, subTopic);
    }

    private static QuestionImportRowDto CreateRow(
        string? topic = null,
        string? mainTopic = null,
        string? subTopic = null) =>
        new(
            2,
            "En az on karakter içeren test sorusu?",
            "Birinci seçenek",
            "İkinci seçenek",
            null,
            null,
            null,
            "A",
            null,
            topic,
            mainTopic,
            subTopic,
            "Test dersi",
            "Medium",
            null,
            null);
}
