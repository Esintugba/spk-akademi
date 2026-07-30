using API.Data;
using API.Dtos;
using API.Entities;
using API.Repositories;
using API.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace API.UnitTests.Services;

public class QuestionServiceTests
{
    [Fact]
    public async Task GetQuestionPageAsync_FiltersAndReturnsOnlyRequestedPage()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var dbOptions = new DbContextOptionsBuilder<DataContext>()
            .UseSqlite(connection)
            .Options;
        await using var context = new DataContext(dbOptions);
        await context.Database.EnsureCreatedAsync();

        var license = new License { Name = "Test", Slug = "test" };
        var course = new Course { License = license, Name = "Test", Slug = "test" };
        var topic = new Topic
        {
            Course = course,
            Title = "Sermaye Piyasası",
            Slug = "sermaye-piyasasi",
            Type = TopicType.SubTopic
        };
        context.Questions.AddRange(
            CreateQuestion(topic, "Aranan birinci soru", ReviewStatus.Approved, new DateTime(2026, 1, 1)),
            CreateQuestion(topic, "Aranan ikinci soru", ReviewStatus.Approved, new DateTime(2026, 1, 2)),
            CreateQuestion(topic, "Başka bir soru", ReviewStatus.Approved, new DateTime(2026, 1, 3)),
            CreateQuestion(topic, "Aranan silinmiş soru", ReviewStatus.Approved, new DateTime(2026, 1, 4), isDeleted: true),
            CreateQuestion(topic, "Aranan taslak soru", ReviewStatus.Draft, new DateTime(2026, 1, 5)));
        await context.SaveChangesAsync();

        var service = new QuestionService(new QuestionRepository(context), new TestLicenseCatalogCache());
        var query = new QuestionListQueryDto(
            TopicId: topic.Id,
            Difficulty: null,
            ReviewStatus: ReviewStatus.Approved,
            IsPastExamQuestion: null,
            Search: "Aranan",
            Page: 2,
            PageSize: 1);

        var result = await service.GetQuestionPageAsync(query, page: 2, pageSize: 1);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.Equal(1, result.PageSize);
        var item = Assert.Single(result.Items);
        Assert.Equal("Aranan birinci soru", item.Text);
        Assert.Equal(topic.Title, item.TopicTitle);
        Assert.Equal(2, item.OptionCount);
    }

    [Fact]
    public async Task UpdateQuestionAsync_AddsFifthOptionToExistingFourOptionQuestion()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var dbOptions = new DbContextOptionsBuilder<DataContext>()
            .UseSqlite(connection)
            .Options;
        await using var context = new DataContext(dbOptions);
        await context.Database.EnsureCreatedAsync();

        var license = new License { Name = "Test", Slug = "test" };
        var course = new Course { License = license, Name = "Test", Slug = "test" };
        var topic = new Topic
        {
            Course = course,
            Title = "Alt konu",
            Slug = "alt-konu",
            Type = TopicType.SubTopic
        };
        var question = new Question
        {
            Topic = topic,
            Text = "Test soru metni",
            Explanation = "Test soru açıklaması",
            Options =
            [
                new() { Label = "A", Text = "A şıkkı", IsCorrect = true },
                new() { Label = "B", Text = "B şıkkı" },
                new() { Label = "C", Text = "C şıkkı" },
                new() { Label = "D", Text = "D şıkkı" }
            ]
        };
        context.Questions.Add(question);
        await context.SaveChangesAsync();

        var dto = new UpdateQuestionDto(
            topic.Id,
            question.Text,
            question.Difficulty,
            question.Type,
            question.Explanation,
            false,
            null,
            null,
            null,
            null,
            null,
            false,
            ReviewStatus.PendingReview,
            ContentAccessLevel.Free,
            question.Options
                .OrderBy(option => option.Label)
                .Select(option => new UpdateQuestionOptionDto(
                    option.Id,
                    option.Label,
                    option.Text,
                    option.IsCorrect))
                .Append(new UpdateQuestionOptionDto(null, "E", "E şıkkı", false))
                .ToList());

        var service = new QuestionService(new QuestionRepository(context), new TestLicenseCatalogCache());

        var outcome = await service.UpdateQuestionAsync(question.Id, dto);

        Assert.Equal(QuestionServiceError.None, outcome.Error);
        var options = await context.QuestionOptions
            .Where(option => option.QuestionId == question.Id)
            .OrderBy(option => option.Label)
            .ToListAsync();
        Assert.Equal(5, options.Count);
        Assert.Equal("E şıkkı", options[^1].Text);
    }

    private sealed class TestLicenseCatalogCache : ILicenseCatalogCache
    {
        public void Invalidate()
        {
        }
    }

    private static Question CreateQuestion(
        Topic topic,
        string text,
        ReviewStatus reviewStatus,
        DateTime createdAt,
        bool isDeleted = false) =>
        new()
        {
            Topic = topic,
            Text = text,
            Explanation = $"{text} açıklaması",
            ReviewStatus = reviewStatus,
            CreatedAt = createdAt,
            IsDeleted = isDeleted,
            Options =
            [
                new() { Label = "A", Text = "A şıkkı", IsCorrect = true },
                new() { Label = "B", Text = "B şıkkı" }
            ]
        };
}
