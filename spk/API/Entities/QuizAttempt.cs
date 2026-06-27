namespace API.Entities;

public class QuizAttempt : BaseEntity
{
    public string? UserId { get; set; }

    public AppUser? User { get; set; }

    public QuizMode Mode { get; set; } = QuizMode.TopicPractice;

    public bool GeneratedFromWrongAnswers { get; set; }

    public string? GeneratedFiltersJson { get; set; }

    public bool GeneratedFromPastExams { get; set; }

    public string? PastExamFilterJson { get; set; }

    public Guid? CourseId { get; set; }

    public Course? Course { get; set; }

    public Guid? TopicId { get; set; }

    public Topic? Topic { get; set; }

    public Guid? TrialExamId { get; set; }

    public TrialExam? TrialExam { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastActivityAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    public QuizAttemptStatus Status { get; set; } = QuizAttemptStatus.Started;

    public int TotalQuestions { get; set; }

    public int CorrectCount { get; set; }

    public int WrongCount { get; set; }

    public ICollection<QuizAttemptQuestion> AttemptQuestions { get; set; } = new List<QuizAttemptQuestion>();

    public ICollection<QuizAnswer> Answers { get; set; } = new List<QuizAnswer>();
}
