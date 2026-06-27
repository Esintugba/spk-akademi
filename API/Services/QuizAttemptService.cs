using API.Data;
using API.Dtos;
using API.Entities;
using API.Helpers;
using API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public enum QuizAttemptError
{
    None,
    Unauthorized,
    Forbidden,
    NotFound,
    NoQuestions,
    InvalidQuestionCount,
    QuestionCountTooHigh,
    AlreadyCompleted,
    Expired,
    EmptyAnswers,
    InvalidAttemptQuestions,
    DuplicateAnswers,
    AnswersDoNotMatchAttempt,
    CorrectOptionMissing,
    OptionDoesNotBelongToQuestion,
    DemoQuestionLimitReached
}

public sealed class QuizAttemptOutcome<T>
{
    public QuizAttemptError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static QuizAttemptOutcome<T> Success(T result) =>
        new() { Error = QuizAttemptError.None, Result = result };

    public static QuizAttemptOutcome<T> Fail(QuizAttemptError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IQuizAttemptService
{
    Task<QuizAttemptOutcome<QuizAttemptDto>> StartFreeTrialAsync(
        string? userId,
        StartFreeTrialExamDto dto,
        CancellationToken cancellationToken = default);

    Task<QuizAttemptOutcome<QuizAttemptDto>> StartPracticeAsync(
        string? userId,
        AppUser? user,
        StartQuizDto dto,
        CancellationToken cancellationToken = default);

    Task<QuizAttemptOutcome<QuizAttemptDto>> GetAttemptAsync(
        string? userId,
        Guid attemptId,
        CancellationToken cancellationToken = default);

    Task<QuizAttemptOutcome<QuizResultDto>> SubmitAsync(
        string? userId,
        Guid attemptId,
        SubmitQuizDto dto,
        CancellationToken cancellationToken = default);
}

public class QuizAttemptService(
    IQuizAttemptRepository attempts,
    ILicenseAccessService accessService,
    IReviewSessionService reviewSessionService,
    IWrongAnswerService wrongAnswerService,
    IGamificationRewardService gamificationRewardService,
    IQuizGenerationService quizGenerationService,
    IStandardQuizStrategy standardQuizStrategy,
    IDemoAccessService demoAccessService,
    DataContext context) : IQuizAttemptService
{
    private const int MaxStartQuizQuestionCount = 100;

    public async Task<QuizAttemptOutcome<QuizAttemptDto>> StartFreeTrialAsync(
        string? userId,
        StartFreeTrialExamDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.Unauthorized);
        }

        var trialExam = await attempts.GetPublishedFreeTrialWithQuestionsAsync(dto.TrialExamId, cancellationToken);
        if (trialExam is null)
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(
                QuizAttemptError.NotFound,
                "Ücretsiz deneme sınavı bulunamadı.");
        }

        var selectedQuestions = trialExam.Questions
            .OrderBy(x => x.Order)
            .Select(x => x.Question)
            .Where(x => x is not null)
            .Select(x => x!)
            .Where(x => x.ReviewStatus == ReviewStatus.Approved)
            .Take(trialExam.QuestionCount)
            .ToList();

        if (selectedQuestions.Count == 0)
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(
                QuizAttemptError.NoQuestions,
                "Bu deneme sınavı için soru bulunamadı.");
        }

        var attempt = await quizGenerationService.CreateAttemptAsync(
            new QuizGenerationRequest
            {
                UserId = userId,
                Mode = QuizMode.FreeTrial,
                Questions = selectedQuestions,
                TrialExamId = trialExam.Id
            },
            cancellationToken);

        return QuizAttemptOutcome<QuizAttemptDto>.Success(
            ToAttemptDto(attempt, selectedQuestions, trialExam.DurationMinutes));
    }

    public async Task<QuizAttemptOutcome<QuizAttemptDto>> StartPracticeAsync(
        string? userId,
        AppUser? user,
        StartQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.Unauthorized);
        }

        if (dto.QuestionCount <= 0)
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(
                QuizAttemptError.InvalidQuestionCount,
                "QuestionCount sıfırdan büyük olmalıdır.");
        }

        if (dto.QuestionCount > MaxStartQuizQuestionCount)
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(
                QuizAttemptError.QuestionCountTooHigh,
                $"QuestionCount en fazla {MaxStartQuizQuestionCount} olabilir.");
        }

        if (!await demoAccessService.CanUseQuestionQuotaAsync(userId, dto.QuestionCount, cancellationToken))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(
                QuizAttemptError.DemoQuestionLimitReached,
                "Demo günlük soru limitiniz doldu. Tam erişim için erişim talebi oluşturabilirsiniz.");
        }

        if (dto.TopicId.HasValue && !await accessService.CanAccessTopic(userId, dto.TopicId.Value))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.Forbidden);
        }

        if (dto.CourseId.HasValue && !await accessService.CanAccessCourse(userId, dto.CourseId.Value))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.Forbidden);
        }

        var selectedQuestions = await standardQuizStrategy.SelectQuestionsAsync(userId, user, dto, cancellationToken);
        if (selectedQuestions.Count == 0)
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(
                QuizAttemptError.NoQuestions,
                "Bu seçim için soru bulunamadı.");
        }

        var attempt = await quizGenerationService.CreateAttemptAsync(
            new QuizGenerationRequest
            {
                UserId = userId,
                Mode = dto.Mode,
                Questions = selectedQuestions,
                CourseId = dto.CourseId,
                TopicId = dto.TopicId
            },
            cancellationToken);

        return QuizAttemptOutcome<QuizAttemptDto>.Success(ToAttemptDto(attempt, selectedQuestions, null));
    }

    public async Task<QuizAttemptOutcome<QuizAttemptDto>> GetAttemptAsync(
        string? userId,
        Guid attemptId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.Unauthorized);
        }

        var attempt = await attempts.GetByIdForAttemptDtoAsync(attemptId, cancellationToken);
        if (attempt is null)
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.NotFound);
        }

        if (!CanAccessAttempt(attempt, userId))
        {
            return QuizAttemptOutcome<QuizAttemptDto>.Fail(QuizAttemptError.Unauthorized);
        }

        var questions = attempt.AttemptQuestions
            .OrderBy(x => x.Order)
            .Select(x => x.Question)
            .Where(x => x is not null)
            .Select(x => x!)
            .ToList();

        return QuizAttemptOutcome<QuizAttemptDto>.Success(
            ToAttemptDto(attempt, questions, attempt.TrialExam?.DurationMinutes));
    }

    public async Task<QuizAttemptOutcome<QuizResultDto>> SubmitAsync(
        string? userId,
        Guid attemptId,
        SubmitQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(QuizAttemptError.Unauthorized);
        }

        var attempt = await attempts.GetByIdForSubmitAsync(attemptId, cancellationToken);
        if (attempt is null)
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(QuizAttemptError.NotFound);
        }

        if (!CanAccessAttempt(attempt, userId))
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(QuizAttemptError.Unauthorized);
        }

        if (attempt.FinishedAt.HasValue)
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(
                QuizAttemptError.AlreadyCompleted,
                "Bu test daha önce tamamlanmış.");
        }

        var expiresAt = GetAttemptExpiresAt(attempt);
        if (expiresAt.HasValue && DateTime.UtcNow > expiresAt.Value)
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(
                QuizAttemptError.Expired,
                "Sınav süresi doldu. Test otomatik olarak kapatıldı.");
        }

        if (dto.Answers.Count == 0)
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(
                QuizAttemptError.EmptyAnswers,
                "En az bir cevap gönderilmelidir.");
        }

        var selectedQuestions = attempt.AttemptQuestions
            .OrderBy(x => x.Order)
            .Select(x => x.Question)
            .Where(x => x is not null)
            .Select(x => x!)
            .ToList();

        if (selectedQuestions.Count != attempt.TotalQuestions)
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(
                QuizAttemptError.InvalidAttemptQuestions,
                "Test soru kayıtları eksik veya bozuk.");
        }

        var attemptQuestionIds = selectedQuestions.Select(x => x.Id).ToHashSet();
        var submittedQuestionIds = dto.Answers.Select(x => x.QuestionId).ToList();

        if (submittedQuestionIds.Count != submittedQuestionIds.Distinct().Count())
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(
                QuizAttemptError.DuplicateAnswers,
                "Aynı soru için birden fazla cevap gönderilemez.");
        }

        if (submittedQuestionIds.Count != attemptQuestionIds.Count ||
            submittedQuestionIds.Any(questionId => !attemptQuestionIds.Contains(questionId)))
        {
            return QuizAttemptOutcome<QuizResultDto>.Fail(
                QuizAttemptError.AnswersDoNotMatchAttempt,
                "Cevaplar yalnızca bu test için seçilen sorulara ait olmalıdır.");
        }

        var submittedAnswersByQuestionId = dto.Answers.ToDictionary(x => x.QuestionId);
        var resultAnswers = new List<QuizResultAnswerDto>();
        var reviewResults = new List<(Guid QuestionId, bool IsCorrect, int? ResponseTimeSeconds)>();

        foreach (var question in selectedQuestions)
        {
            var submittedAnswer = submittedAnswersByQuestionId[question.Id];
            var correctOption = question.Options.SingleOrDefault(x => x.IsCorrect);

            if (correctOption is null)
            {
                return QuizAttemptOutcome<QuizResultDto>.Fail(
                    QuizAttemptError.CorrectOptionMissing,
                    $"Soru için doğru seçenek bulunamadı: {question.Id}");
            }

            var selectedOption = submittedAnswer.SelectedOptionId.HasValue
                ? question.Options.FirstOrDefault(x => x.Id == submittedAnswer.SelectedOptionId.Value)
                : null;

            if (submittedAnswer.SelectedOptionId.HasValue && selectedOption is null)
            {
                return QuizAttemptOutcome<QuizResultDto>.Fail(
                    QuizAttemptError.OptionDoesNotBelongToQuestion,
                    $"Seçenek bu soruya ait değil: {submittedAnswer.SelectedOptionId}");
            }

            var isCorrect = selectedOption?.Id == correctOption.Id;

            attempts.AddQuizAnswer(new QuizAnswer
            {
                QuizAttemptId = attempt.Id,
                QuestionId = question.Id,
                SelectedOptionId = selectedOption?.Id,
                IsCorrect = isCorrect,
                TimeSpentSeconds = submittedAnswer.TimeSpentSeconds,
                AnsweredAt = DateTime.UtcNow
            });

            resultAnswers.Add(new QuizResultAnswerDto(
                question.Id,
                selectedOption?.Id,
                correctOption.Id,
                isCorrect,
                question.Explanation));

            reviewResults.Add((question.Id, isCorrect, submittedAnswer.TimeSpentSeconds));
        }

        attempt.FinishedAt = DateTime.UtcNow;
        attempt.Status = QuizAttemptStatus.Completed;
        attempt.CorrectCount = resultAnswers.Count(x => x.IsCorrect);
        attempt.WrongCount = resultAnswers.Count(x => !x.IsCorrect);
        attempt.TotalQuestions = resultAnswers.Count;
        attempt.UpdatedAt = DateTime.UtcNow;

        var successRate = attempt.TotalQuestions == 0
            ? 0
            : Math.Round((decimal)attempt.CorrectCount / attempt.TotalQuestions * 100, 2);

        await UpdateStudyProgress(userId, selectedQuestions, resultAnswers, cancellationToken);

        await reviewSessionService.SyncFromQuizAnswersAsync(
            userId,
            reviewResults.Select(x => new QuizAnswerSyncItem(x.QuestionId, x.IsCorrect, x.ResponseTimeSeconds)).ToList(),
            cancellationToken);

        if (attempt.Mode == QuizMode.WrongAnswers)
        {
            await wrongAnswerService.ProcessReviewResultsAsync(userId, attempt.Id, reviewResults);
        }
        else
        {
            var autoAddWrongAnswers = await GetAutoAddWrongAnswersPreferenceAsync(userId, cancellationToken);
            foreach (var review in reviewResults.Where(x => !x.IsCorrect && autoAddWrongAnswers))
            {
                await wrongAnswerService.RecordWrongAnswerAsync(userId, review.QuestionId);
            }
        }

        await attempts.SaveChangesAsync(cancellationToken);
        var unlockedBadges = await gamificationRewardService.ApplyQuizCompletionAsync(
            new QuizCompletedEvent(
                userId,
                attempt.Id,
                attempt.TrialExamId,
                attempt.TotalQuestions,
                attempt.CorrectCount,
                successRate,
                attempt.FinishedAt ?? DateTime.UtcNow),
            cancellationToken);

        return QuizAttemptOutcome<QuizResultDto>.Success(new QuizResultDto(
            attempt.Id,
            attempt.TotalQuestions,
            attempt.CorrectCount,
            attempt.WrongCount,
            successRate,
            resultAnswers,
            ToUnlockedBadgeDtos(unlockedBadges)));
    }

    private static bool CanAccessAttempt(QuizAttempt attempt, string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(attempt.UserId))
        {
            return false;
        }

        return attempt.UserId == userId;
    }

    private static IReadOnlyList<UnlockedBadgeDto> ToUnlockedBadgeDtos(IReadOnlyList<UserBadge> unlockedBadges) =>
        unlockedBadges
            .Where(x => x.Badge is not null)
            .Select(x => new UnlockedBadgeDto(
                x.BadgeId,
                x.Badge!.Name,
                x.Badge.Description,
                x.Badge.IconUrl,
                x.Badge.XPReward,
                x.Badge.Category,
                x.UnlockedAt))
            .ToList();

    private static DateTime? GetAttemptExpiresAt(QuizAttempt attempt)
    {
        if (attempt.Mode != QuizMode.TrialExam || attempt.TrialExam is null)
        {
            return null;
        }

        return attempt.StartedAt.AddMinutes(attempt.TrialExam.DurationMinutes);
    }

    private async Task<bool> GetAutoAddWrongAnswersPreferenceAsync(
        string userId,
        CancellationToken cancellationToken) =>
        await context.UserSettings
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => (bool?)x.AutoAddWrongAnswersToReview)
            .FirstOrDefaultAsync(cancellationToken) ?? true;

    private async Task UpdateStudyProgress(
        string userId,
        IReadOnlyList<Question> questions,
        IReadOnlyList<QuizResultAnswerDto> resultAnswers,
        CancellationToken cancellationToken)
    {
        var topicIds = questions.Select(x => x.TopicId).Distinct().ToList();
        var progresses = await attempts.GetStudyProgressesAsync(userId, topicIds, cancellationToken);

        foreach (var topicId in topicIds)
        {
            var progress = progresses.FirstOrDefault(x => x.TopicId == topicId && x.UserId == userId);

            if (progress is null)
            {
                progress = new StudyProgress
                {
                    TopicId = topicId,
                    UserId = userId
                };
                attempts.AddStudyProgress(progress);
            }

            var questionIds = questions
                .Where(x => x.TopicId == topicId)
                .Select(x => x.Id)
                .ToList();

            var topicResults = resultAnswers
                .Where(x => questionIds.Contains(x.QuestionId))
                .ToList();

            progress.CorrectCount += topicResults.Count(x => x.IsCorrect);
            progress.WrongCount += topicResults.Count(x => !x.IsCorrect);
            progress.LastStudiedAt = DateTime.UtcNow;
            progress.NextReviewAt = topicResults.Any(x => !x.IsCorrect)
                ? DateTime.UtcNow.AddDays(1)
                : DateTime.UtcNow.AddDays(7);
            progress.Status = topicResults.Any(x => !x.IsCorrect)
                ? StudyStatus.NeedsReview
                : StudyStatus.Studied;
            progress.UpdatedAt = DateTime.UtcNow;
        }
    }

    private static QuizAttemptDto ToAttemptDto(
        QuizAttempt attempt,
        IReadOnlyList<Question> questions,
        int? durationMinutes)
    {
        var expiresAt = durationMinutes.HasValue
            ? attempt.StartedAt.AddMinutes(durationMinutes.Value)
            : (DateTime?)null;

        var filters = CoursePracticeFilterHelper.TryParse(attempt.GeneratedFiltersJson);
        var shuffleOptions = attempt.Mode == QuizMode.CoursePractice && (filters?.RandomizeOptions ?? false);

        return new QuizAttemptDto(
            attempt.Id,
            attempt.Mode,
            attempt.CourseId,
            attempt.TopicId,
            attempt.TrialExamId,
            attempt.StartedAt,
            attempt.FinishedAt,
            durationMinutes,
            expiresAt,
            expiresAt.HasValue && DateTime.UtcNow > expiresAt.Value,
            attempt.TotalQuestions,
            attempt.CorrectCount,
            attempt.WrongCount,
            questions.Select(question =>
            {
                var options = question.Options.AsEnumerable();
                if (shuffleOptions)
                {
                    options = options.OrderBy(_ => Random.Shared.Next());
                }
                else
                {
                    options = options.OrderBy(option => option.Label);
                }

                return new QuizQuestionDto(
                    question.Id,
                    question.Text,
                    question.Difficulty,
                    question.Type,
                    options.Select(option => new QuizQuestionOptionDto(option.Id, option.Label, option.Text)).ToList());
            }).ToList());
    }
}
