using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public enum QuestionServiceError
{
    None,
    NotFound,
    InvalidTopic,
    TooFewOptions,
    InvalidCorrectOptionCount,
    DuplicateOptionLabels
}

public sealed class QuestionServiceOutcome<T>
{
    public QuestionServiceError Error { get; init; }

    public string? Message { get; init; }

    public T? Result { get; init; }

    public static QuestionServiceOutcome<T> Success(T result) =>
        new() { Error = QuestionServiceError.None, Result = result };

    public static QuestionServiceOutcome<T> Fail(QuestionServiceError error, string? message = null) =>
        new() { Error = error, Message = message };
}

public interface IQuestionService
{
    Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(
        Guid? topicId,
        ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default);

    Task<QuestionServiceOutcome<QuestionDto>> GetQuestionAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<QuestionServiceOutcome<QuestionDto>> CreateQuestionAsync(
        CreateQuestionDto dto,
        CancellationToken cancellationToken = default);

    Task<QuestionServiceOutcome<bool>> UpdateQuestionAsync(
        Guid id,
        UpdateQuestionDto dto,
        CancellationToken cancellationToken = default);

    Task<QuestionServiceOutcome<bool>> DeleteQuestionAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public class QuestionService(
    IQuestionRepository questions,
    ILicenseCatalogCache licenseCatalogCache) : IQuestionService
{
    public async Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(
        Guid? topicId,
        ReviewStatus? reviewStatus,
        CancellationToken cancellationToken = default)
    {
        var items = await questions.GetQuestionsAsync(topicId, reviewStatus, cancellationToken);
        return items.Select(ToDto).ToList();
    }

    public async Task<QuestionServiceOutcome<QuestionDto>> GetQuestionAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var question = await questions.GetByIdAsync(id, cancellationToken);
        return question is null
            ? QuestionServiceOutcome<QuestionDto>.Fail(QuestionServiceError.NotFound)
            : QuestionServiceOutcome<QuestionDto>.Success(ToDto(question));
    }

    public async Task<QuestionServiceOutcome<QuestionDto>> CreateQuestionAsync(
        CreateQuestionDto dto,
        CancellationToken cancellationToken = default)
    {
        var validation = await ValidateQuestionAsync(dto.TopicId, dto.Options, cancellationToken);
        if (validation is not null)
        {
            return QuestionServiceOutcome<QuestionDto>.Fail(validation.Value.Error, validation.Value.Message);
        }

        var question = new Question
        {
            TopicId = dto.TopicId,
            Text = dto.Text,
            Difficulty = dto.Difficulty,
            Type = dto.Type,
            Explanation = dto.Explanation,
            IsPastExamQuestion = dto.IsPastExamQuestion,
            ExamYear = dto.ExamYear,
            ExamType = dto.ExamType,
            ExamSession = dto.ExamSession,
            SourceReference = dto.SourceReference,
            SourceText = dto.SourceText,
            IsAiGenerated = dto.IsAiGenerated,
            ReviewStatus = dto.ReviewStatus,
            AccessLevel = dto.AccessLevel,
            Options = dto.Options.Select(option => new QuestionOption
            {
                Label = option.Label,
                Text = option.Text,
                IsCorrect = option.IsCorrect
            }).ToList()
        };

        await questions.AddAsync(question, cancellationToken);
        await questions.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return QuestionServiceOutcome<QuestionDto>.Success(ToDto(question));
    }

    public async Task<QuestionServiceOutcome<bool>> UpdateQuestionAsync(
        Guid id,
        UpdateQuestionDto dto,
        CancellationToken cancellationToken = default)
    {
        var question = await questions.GetByIdForUpdateAsync(id, cancellationToken);
        if (question is null)
        {
            return QuestionServiceOutcome<bool>.Fail(QuestionServiceError.NotFound);
        }

        var validation = await ValidateQuestionAsync(dto.TopicId, dto.Options, cancellationToken);
        if (validation is not null)
        {
            return QuestionServiceOutcome<bool>.Fail(validation.Value.Error, validation.Value.Message);
        }

        question.TopicId = dto.TopicId;
        question.Text = dto.Text;
        question.Difficulty = dto.Difficulty;
        question.Type = dto.Type;
        question.Explanation = dto.Explanation;
        question.IsPastExamQuestion = dto.IsPastExamQuestion;
        question.ExamYear = dto.ExamYear;
        question.ExamType = dto.ExamType;
        question.ExamSession = dto.ExamSession;
        question.SourceReference = dto.SourceReference;
        question.SourceText = dto.SourceText;
        question.IsAiGenerated = dto.IsAiGenerated;
        question.ReviewStatus = dto.ReviewStatus;
        question.AccessLevel = dto.AccessLevel;
        question.UpdatedAt = DateTime.UtcNow;

        questions.RemoveOptions(question.Options);
        question.Options = dto.Options.Select(option => new QuestionOption
        {
            QuestionId = question.Id,
            Label = option.Label,
            Text = option.Text,
            IsCorrect = option.IsCorrect
        }).ToList();

        await questions.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return QuestionServiceOutcome<bool>.Success(true);
    }

    public async Task<QuestionServiceOutcome<bool>> DeleteQuestionAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var question = await questions.GetByIdForUpdateAsync(id, cancellationToken);
        if (question is null)
        {
            return QuestionServiceOutcome<bool>.Fail(QuestionServiceError.NotFound);
        }

        question.IsDeleted = true;
        question.DeletedAt = DateTime.UtcNow;
        question.UpdatedAt = DateTime.UtcNow;

        await questions.SaveChangesAsync(cancellationToken);
        licenseCatalogCache.Invalidate();

        return QuestionServiceOutcome<bool>.Success(true);
    }

    private async Task<(QuestionServiceError Error, string Message)?> ValidateQuestionAsync(
        Guid topicId,
        IReadOnlyList<CreateQuestionOptionDto> options,
        CancellationToken cancellationToken)
    {
        if (!await questions.TopicExistsAsync(topicId, cancellationToken))
        {
            return (QuestionServiceError.InvalidTopic, "TopicId geçersiz.");
        }

        if (!await questions.IsSubTopicAsync(topicId, cancellationToken))
        {
            return (QuestionServiceError.InvalidTopic, "Sorular yalnızca alt konuya bağlanabilir.");
        }

        if (options.Count < 2)
        {
            return (QuestionServiceError.TooFewOptions, "En az iki seçenek girilmelidir.");
        }

        if (options.Count(x => x.IsCorrect) != 1)
        {
            return (QuestionServiceError.InvalidCorrectOptionCount, "Her soruda yalnızca bir doğru seçenek olmalıdır.");
        }

        if (options.Select(x => x.Label).Distinct(StringComparer.OrdinalIgnoreCase).Count() != options.Count)
        {
            return (QuestionServiceError.DuplicateOptionLabels, "Seçenek etiketleri benzersiz olmalıdır.");
        }

        return null;
    }

    private static QuestionDto ToDto(Question question)
    {
        return new QuestionDto(
            question.Id,
            question.TopicId,
            question.Text,
            question.Difficulty,
            question.Type,
            question.Explanation,
            question.IsPastExamQuestion,
            question.ExamYear,
            question.ExamType,
            question.ExamSession,
            question.SourceReference,
            question.SourceText,
            question.IsAiGenerated,
            question.ReviewStatus,
            question.AccessLevel,
            question.ReviewedBy?.Email,
            question.ReviewedAt,
            question.ReviewComment,
            question.Options
                .OrderBy(x => x.Label)
                .Select(x => new QuestionOptionDto(x.Id, x.Label, x.Text, x.IsCorrect))
                .ToList());
    }
}
