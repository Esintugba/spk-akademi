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
}
