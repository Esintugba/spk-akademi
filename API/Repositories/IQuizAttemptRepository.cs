using API.Entities;

namespace API.Repositories;

public interface IQuizAttemptRepository
{
    Task<QuizAttempt?> GetByIdAsync(Guid attemptId, CancellationToken cancellationToken = default);

    Task<QuizAttempt?> GetByIdForSessionAsync(Guid attemptId, CancellationToken cancellationToken = default);

    Task<QuizAttempt?> GetByIdForAttemptDtoAsync(
        Guid attemptId,
        CancellationToken cancellationToken = default);

    Task<QuizAttempt?> GetByIdForSubmitAsync(
        Guid attemptId,
        CancellationToken cancellationToken = default);

    Task<TrialExam?> GetPublishedFreeTrialWithQuestionsAsync(
        Guid trialExamId,
        CancellationToken cancellationToken = default);

    IQueryable<Question> QueryQuestions();

    Task<List<Question>> GetQuestionsWithOptionsAsync(
        IReadOnlyCollection<Guid> questionIds,
        CancellationToken cancellationToken = default);

    Task<List<StudyProgress>> GetStudyProgressesAsync(
        string userId,
        IReadOnlyCollection<Guid> topicIds,
        CancellationToken cancellationToken = default);

    Task<QuizAttempt?> GetUnfinishedTrialAttemptAsync(
        string userId,
        Guid trialExamId,
        CancellationToken cancellationToken = default);

    Task<QuizAttempt?> GetActiveAttemptAsync(
        string userId,
        QuizMode mode,
        Guid? trialExamId = null,
        Guid? courseId = null,
        Guid? topicId = null,
        CancellationToken cancellationToken = default);

    Task<List<QuizAttempt>> GetActiveAttemptsAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<QuizAttempt?> GetLatestAttemptAsync(
        string userId,
        Guid trialExamId,
        CancellationToken cancellationToken = default);

    Task AddAsync(QuizAttempt attempt, CancellationToken cancellationToken = default);

    void AddQuizAnswer(QuizAnswer answer);

    void AddStudyProgress(StudyProgress progress);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
