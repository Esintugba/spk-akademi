namespace API.Entities;

public class TrialExamQuestion
{
    public Guid TrialExamId { get; set; }

    public TrialExam? TrialExam { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public int Order { get; set; }
}
