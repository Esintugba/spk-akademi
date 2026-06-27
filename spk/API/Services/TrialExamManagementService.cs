using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum TrialExamManagementError
{
    None,
    NotFound,
    InvalidDuration,
    InvalidQuestionCount,
    NoQuestions,
    NotEnoughAssignedQuestions,
    InvalidLicense,
    InvalidQuestions
}

public sealed class TrialExamManagementOutcome<T>
{
    public TrialExamManagementError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static TrialExamManagementOutcome<T> Success(T result) =>
        new() { Error = TrialExamManagementError.None, Result = result };

    public static TrialExamManagementOutcome<T> Fail(TrialExamManagementError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface ITrialExamManagementService
{
    Task<IReadOnlyList<TrialExamSummaryDto>> GetTrialExamsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrialExamSummaryDto>> GetFreeTrialExamsAsync(CancellationToken cancellationToken = default);

    Task<TrialExamManagementOutcome<TrialExamDetailDto>> GetTrialExamAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<TrialExamManagementOutcome<TrialExamDetailDto>> CreateTrialExamAsync(
        CreateTrialExamDto dto,
        CancellationToken cancellationToken = default);

    Task<TrialExamManagementOutcome<bool>> UpdateTrialExamAsync(
        Guid id,
        UpdateTrialExamDto dto,
        CancellationToken cancellationToken = default);

    Task<TrialExamManagementOutcome<bool>> DeleteTrialExamAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class TrialExamManagementService(
    ITrialExamRepository trialExams,
    ILicenseCatalogCache licenseCatalogCache) : ITrialExamManagementService
{
    public async Task<IReadOnlyList<TrialExamSummaryDto>> GetTrialExamsAsync(
        CancellationToken cancellationToken = default)
    {
        var exams = await trialExams.GetAllForManagementAsync(cancellationToken);
        return exams.Select(ToSummaryDto).ToList();
    }

    public async Task<IReadOnlyList<TrialExamSummaryDto>> GetFreeTrialExamsAsync(
        CancellationToken cancellationToken = default)
    {
        var exams = await trialExams.GetFreePublishedAsync(cancellationToken);
        return exams.Select(ToSummaryDto).ToList();
    }

    public async Task<TrialExamManagementOutcome<TrialExamDetailDto>> GetTrialExamAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var exam = await trialExams.GetByIdForDetailAsync(id, cancellationToken);
        return exam is null
            ? TrialExamManagementOutcome<TrialExamDetailDto>.Fail(TrialExamManagementError.NotFound)
            : TrialExamManagementOutcome<TrialExamDetailDto>.Success(ToDetailDto(exam));
    }

    public async Task<TrialExamManagementOutcome<TrialExamDetailDto>> CreateTrialExamAsync(
        CreateTrialExamDto dto,
        CancellationToken cancellationToken = default)
    {
        var validation = await ValidateAsync(
            dto.LicenseId,
            dto.DurationMinutes,
            dto.QuestionCount,
            dto.QuestionIds,
            cancellationToken);

        if (validation is not null)
        {
            return TrialExamManagementOutcome<TrialExamDetailDto>.Fail(validation.Value.Error, validation.Value.Message);
        }

        var exam = new TrialExam
        {
            Title = dto.Title.Trim(),
            Slug = dto.Slug.Trim(),
            Description = dto.Description.Trim(),
            LicenseId = dto.LicenseId,
            DurationMinutes = dto.DurationMinutes,
            QuestionCount = dto.QuestionCount,
            IsFree = dto.IsFree,
            IsPublished = dto.IsPublished,
            IsFeatured = dto.IsFeatured,
            DifficultyLevel = dto.DifficultyLevel,
            Tags = dto.Tags?.Trim(),
            PopularityScore = dto.PopularityScore,
            ReviewStatus = dto.ReviewStatus,
            AccessLevel = dto.AccessLevel,
            Questions = BuildQuestions(dto.QuestionIds, null)
        };

        await trialExams.AddAsync(exam, cancellationToken);
        await trialExams.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return TrialExamManagementOutcome<TrialExamDetailDto>.Success(ToDetailDto(exam));
    }

    public async Task<TrialExamManagementOutcome<bool>> UpdateTrialExamAsync(
        Guid id,
        UpdateTrialExamDto dto,
        CancellationToken cancellationToken = default)
    {
        var exam = await trialExams.GetByIdForUpdateAsync(id, cancellationToken);
        if (exam is null)
        {
            return TrialExamManagementOutcome<bool>.Fail(TrialExamManagementError.NotFound);
        }

        var validation = await ValidateAsync(
            dto.LicenseId,
            dto.DurationMinutes,
            dto.QuestionCount,
            dto.QuestionIds,
            cancellationToken);

        if (validation is not null)
        {
            return TrialExamManagementOutcome<bool>.Fail(validation.Value.Error, validation.Value.Message);
        }

        exam.Title = dto.Title.Trim();
        exam.Slug = dto.Slug.Trim();
        exam.Description = dto.Description.Trim();
        exam.LicenseId = dto.LicenseId;
        exam.DurationMinutes = dto.DurationMinutes;
        exam.QuestionCount = dto.QuestionCount;
        exam.IsFree = dto.IsFree;
        exam.IsPublished = dto.IsPublished;
        exam.IsFeatured = dto.IsFeatured;
        exam.DifficultyLevel = dto.DifficultyLevel;
        exam.Tags = dto.Tags?.Trim();
        exam.PopularityScore = dto.PopularityScore;
        exam.ReviewStatus = dto.ReviewStatus;
        exam.AccessLevel = dto.AccessLevel;
        exam.UpdatedAt = DateTime.UtcNow;

        trialExams.RemoveQuestions(exam.Questions);
        exam.Questions = BuildQuestions(dto.QuestionIds, exam.Id);

        await trialExams.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return TrialExamManagementOutcome<bool>.Success(true);
    }

    public async Task<TrialExamManagementOutcome<bool>> DeleteTrialExamAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var exam = await trialExams.GetByIdForUpdateAsync(id, cancellationToken);
        if (exam is null)
        {
            return TrialExamManagementOutcome<bool>.Fail(TrialExamManagementError.NotFound);
        }

        exam.IsDeleted = true;
        exam.DeletedAt = DateTime.UtcNow;
        exam.UpdatedAt = DateTime.UtcNow;
        await trialExams.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return TrialExamManagementOutcome<bool>.Success(true);
    }

    private async Task<(TrialExamManagementError Error, string Message)?> ValidateAsync(
        Guid? licenseId,
        int durationMinutes,
        int questionCount,
        IReadOnlyList<Guid> questionIds,
        CancellationToken cancellationToken)
    {
        if (durationMinutes <= 0)
        {
            return (TrialExamManagementError.InvalidDuration, "Sınav süresi sıfırdan büyük olmalıdır.");
        }

        if (questionCount <= 0)
        {
            return (TrialExamManagementError.InvalidQuestionCount, "Soru sayısı sıfırdan büyük olmalıdır.");
        }

        if (questionIds.Count == 0)
        {
            return (TrialExamManagementError.NoQuestions, "Deneme sınavına en az bir soru eklenmelidir.");
        }

        if (questionIds.Count < questionCount)
        {
            return (TrialExamManagementError.NotEnoughAssignedQuestions, "Atanan soru sayısı, sınav soru sayısından az olamaz.");
        }

        if (licenseId.HasValue && !await trialExams.LicenseExistsAsync(licenseId.Value, cancellationToken))
        {
            return (TrialExamManagementError.InvalidLicense, "LicenseId geçersiz.");
        }

        var distinctQuestionIds = questionIds.Distinct().ToList();
        var existingQuestionCount = await trialExams.CountExistingQuestionsAsync(distinctQuestionIds, cancellationToken);

        return existingQuestionCount == distinctQuestionIds.Count
            ? null
            : (TrialExamManagementError.InvalidQuestions, "Seçilen sorulardan bazıları bulunamadı.");
    }

    private static List<TrialExamQuestion> BuildQuestions(
        IReadOnlyList<Guid> questionIds,
        Guid? trialExamId) =>
        questionIds
            .Distinct()
            .Select((questionId, index) =>
            {
                var trialExamQuestion = new TrialExamQuestion
                {
                    QuestionId = questionId,
                    Order = index + 1
                };

                if (trialExamId.HasValue)
                {
                    trialExamQuestion.TrialExamId = trialExamId.Value;
                }

                return trialExamQuestion;
            })
            .ToList();

    private static TrialExamSummaryDto ToSummaryDto(TrialExam exam)
    {
        return new TrialExamSummaryDto(
            exam.Id,
            exam.Title,
            exam.Slug,
            exam.Description,
            exam.LicenseId,
            exam.DurationMinutes,
            exam.QuestionCount,
            exam.IsFree,
            exam.IsPublished,
            exam.IsFeatured,
            exam.DifficultyLevel,
            exam.Tags,
            exam.PopularityScore,
            exam.Questions.Count,
            exam.ReviewStatus,
            exam.AccessLevel,
            exam.ReviewedBy?.Email,
            exam.ReviewedAt,
            exam.ReviewComment);
    }

    private static TrialExamDetailDto ToDetailDto(TrialExam exam)
    {
        return new TrialExamDetailDto(
            exam.Id,
            exam.Title,
            exam.Slug,
            exam.Description,
            exam.LicenseId,
            exam.DurationMinutes,
            exam.QuestionCount,
            exam.IsFree,
            exam.IsPublished,
            exam.IsFeatured,
            exam.DifficultyLevel,
            exam.Tags,
            exam.PopularityScore,
            exam.ReviewStatus,
            exam.AccessLevel,
            exam.ReviewedBy?.Email,
            exam.ReviewedAt,
            exam.ReviewComment,
            exam.Questions.OrderBy(x => x.Order).Select(x => x.QuestionId).ToList());
    }
}
