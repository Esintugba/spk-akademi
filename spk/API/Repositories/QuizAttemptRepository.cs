using API.Data;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class QuizAttemptRepository(DataContext context) : IQuizAttemptRepository
{
    public Task<QuizAttempt?> GetByIdAsync(Guid attemptId, CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .Include(x => x.TrialExam)
            .Include(x => x.AttemptQuestions)
            .FirstOrDefaultAsync(x => x.Id == attemptId, cancellationToken);

    public Task<QuizAttempt?> GetByIdForSessionAsync(Guid attemptId, CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .Include(x => x.TrialExam)
            .Include(x => x.AttemptQuestions)
                .ThenInclude(x => x.Question)
            .FirstOrDefaultAsync(x => x.Id == attemptId, cancellationToken);

    public Task<QuizAttempt?> GetByIdForAttemptDtoAsync(
        Guid attemptId,
        CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .AsNoTracking()
            .Include(x => x.AttemptQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .Include(x => x.TrialExam)
            .FirstOrDefaultAsync(x => x.Id == attemptId, cancellationToken);

    public Task<QuizAttempt?> GetByIdForSubmitAsync(
        Guid attemptId,
        CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .Include(x => x.Answers)
            .Include(x => x.AttemptQuestions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .Include(x => x.TrialExam)
            .FirstOrDefaultAsync(x => x.Id == attemptId, cancellationToken);

    public Task<TrialExam?> GetPublishedFreeTrialWithQuestionsAsync(
        Guid trialExamId,
        CancellationToken cancellationToken = default) =>
        context.TrialExams
            .AsNoTracking()
            .Include(x => x.Questions)
                .ThenInclude(x => x.Question)
                    .ThenInclude(x => x!.Options)
            .FirstOrDefaultAsync(x => x.Id == trialExamId && x.IsFree && x.IsPublished, cancellationToken);

    public IQueryable<Question> QueryQuestions() => context.Questions;

    public Task<List<Question>> GetQuestionsWithOptionsAsync(
        IReadOnlyCollection<Guid> questionIds,
        CancellationToken cancellationToken = default) =>
        context.Questions
            .AsNoTracking()
            .Where(x => questionIds.Contains(x.Id))
            .Include(x => x.Options)
            .ToListAsync(cancellationToken);

    public Task<List<StudyProgress>> GetStudyProgressesAsync(
        string userId,
        IReadOnlyCollection<Guid> topicIds,
        CancellationToken cancellationToken = default) =>
        context.StudyProgresses
            .Where(x => x.UserId == userId && topicIds.Contains(x.TopicId))
            .ToListAsync(cancellationToken);

    public Task<QuizAttempt?> GetUnfinishedTrialAttemptAsync(
        string userId,
        Guid trialExamId,
        CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .Include(x => x.TrialExam)
            .Include(x => x.AttemptQuestions)
            .Where(x =>
                x.UserId == userId
                && (x.Mode == QuizMode.TrialExam || x.Mode == QuizMode.LicensedQuiz || x.Mode == QuizMode.FreeTrial)
                && x.TrialExamId == trialExamId
                && !x.FinishedAt.HasValue
                && x.Status != QuizAttemptStatus.Completed
                && x.Status != QuizAttemptStatus.Expired)
            .OrderByDescending(x => x.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<QuizAttempt?> GetActiveAttemptAsync(
        string userId,
        QuizMode mode,
        Guid? trialExamId = null,
        Guid? courseId = null,
        Guid? topicId = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.QuizAttempts
            .Include(x => x.TrialExam)
            .Where(x =>
                x.UserId == userId
                && x.Mode == mode
                && !x.FinishedAt.HasValue
                && x.Status != QuizAttemptStatus.Completed
                && x.Status != QuizAttemptStatus.Expired);

        if (trialExamId.HasValue)
        {
            query = query.Where(x => x.TrialExamId == trialExamId);
        }

        if (courseId.HasValue)
        {
            query = query.Where(x => x.CourseId == courseId);
        }

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId);
        }

        return query
            .OrderByDescending(x => x.LastActivityAt ?? x.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<List<QuizAttempt>> GetActiveAttemptsAsync(
        string userId,
        CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .Include(x => x.TrialExam)
            .Where(x =>
                x.UserId == userId
                && !x.FinishedAt.HasValue
                && x.Status != QuizAttemptStatus.Completed
                && x.Status != QuizAttemptStatus.Expired)
            .OrderByDescending(x => x.LastActivityAt ?? x.StartedAt)
            .ToListAsync(cancellationToken);

    public Task<QuizAttempt?> GetLatestAttemptAsync(
        string userId,
        Guid trialExamId,
        CancellationToken cancellationToken = default) =>
        context.QuizAttempts
            .Where(x =>
                x.UserId == userId
                && (x.Mode == QuizMode.TrialExam || x.Mode == QuizMode.LicensedQuiz || x.Mode == QuizMode.FreeTrial)
                && x.TrialExamId == trialExamId)
            .OrderByDescending(x => x.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(QuizAttempt attempt, CancellationToken cancellationToken = default) =>
        await context.QuizAttempts.AddAsync(attempt, cancellationToken);

    public void AddQuizAnswer(QuizAnswer answer) => context.QuizAnswers.Add(answer);

    public void AddStudyProgress(StudyProgress progress) => context.StudyProgresses.Add(progress);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
