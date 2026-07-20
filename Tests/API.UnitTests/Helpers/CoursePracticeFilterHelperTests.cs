using API.Helpers;
using API.Entities;

namespace API.UnitTests.Helpers;

public class CoursePracticeFilterHelperTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryParse_WhenJsonIsNullOrWhiteSpace_ReturnsNull(string? json)
   {
    // Act
    var result = CoursePracticeFilterHelper.TryParse(json);

    // Assert
    Assert.Null(result);

  }

    [Theory]
    [InlineData("{")]
    [InlineData("not-json")]
    [InlineData("{\"courseId\":}")]
    public void TryParse_WhenJsonIsInValid_ReturnsNull(string json)
    {
        //Act
        var result=CoursePracticeFilterHelper.TryParse(json);

        //Assert
        Assert.Null(result);
    }

    public void TryParse_WhenJsonIsValid_ReturnsSnapshotWithExpectedValues()
    {
        //Arrange
        var expectedCourseId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var expectedTopicId= Guid.Parse("22222222-2222-2222-2222-222222222222");

        var json="""
        {
          "courseId":"11111111-1111-1111-1111-111111111111",
          "questionCount":20,
          "difficultyLevels":[1,3],
          "topicIds":["22222222-2222-2222-2222-222222222222"],
          "includeWrongAnswered":true,
          "randomizeQuestions":false,
          "randomizeOptions":true
        }
        """;

        //Act
        var result=CoursePracticeFilterHelper.TryParse(json);

        //Assert
        Assert.NotNull(result);
        Assert.Equal(expectedCourseId, result.CourseId);
        Assert.Equal(20,result.QuestionCount);
        Assert.Equal(
            new[] { QuestionDifficulty.Easy, QuestionDifficulty.Hard },
            result.DifficultyLevels);
        Assert.Single(result.TopicIds);
        Assert.Equal(expectedTopicId, result.TopicIds[0]);
        Assert.False(result.RandomizeQuestions);
        Assert.True(result.RandomizeOptions);    
    }
    
}