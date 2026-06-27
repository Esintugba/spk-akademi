namespace API.Entities;

public class CoursePracticeFilterSnapshot
{
    public Guid CourseId { get; set; }

    public int QuestionCount { get; set; }

    public List<QuestionDifficulty> DifficultyLevels { get; set; } = [];

    public List<Guid> TopicIds { get; set; } = [];

    public bool IncludeWrongAnswered { get; set; }

    public bool RandomizeQuestions { get; set; }

    public bool RandomizeOptions { get; set; }
}
