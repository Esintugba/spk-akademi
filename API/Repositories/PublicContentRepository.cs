using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public interface IPublicContentRepository
{
    Task<IReadOnlyList<PublicQuestionDto>> GetQuestionBankAsync(
        Guid? topicId,
        string? search,
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PublicQuestionDto>> GetMiniQuizQuestionsAsync(
        int questionCount,
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Question>> GetMiniQuizQuestionsForEvaluationAsync(
        IReadOnlyCollection<Guid> questionIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrialExamSummaryDto>> GetExampleTrialsAsync(
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default);
}

public class PublicContentRepository(DataContext context) : IPublicContentRepository
{
    public async Task<IReadOnlyList<PublicQuestionDto>> GetQuestionBankAsync(
        Guid? topicId,
        string? search,
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyPublicQuestionVisibility(context.Questions.AsNoTracking())
            .Where(x => x.AccessLevel == accessLevel);

        if (topicId.HasValue)
        {
            query = query.Where(x => x.TopicId == topicId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(x => x.Text.Contains(keyword));
        }

        return await query
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Take(100)
            .Select(x => new PublicQuestionDto(
                x.Id,
                x.TopicId,
                x.Topic != null ? x.Topic.Title : "Konu",
                x.Text,
                x.SourceReference,
                x.AccessLevel,
                x.Options
                    .OrderBy(option => option.Label)
                    .Select(option => new QuizQuestionOptionDto(option.Id, option.Label, option.Text))
                    .ToList()))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PublicQuestionDto>> GetMiniQuizQuestionsAsync(
        int questionCount,
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default) =>
        await ApplyPublicQuestionVisibility(context.Questions.AsNoTracking())
            .Where(x => x.AccessLevel == accessLevel)
            .OrderBy(_ => Guid.NewGuid())
            .Take(questionCount)
            .Select(x => new PublicQuestionDto(
                x.Id,
                x.TopicId,
                x.Topic != null ? x.Topic.Title : "Konu",
                x.Text,
                x.SourceReference,
                x.AccessLevel,
                x.Options
                    .OrderBy(option => option.Label)
                    .Select(option => new QuizQuestionOptionDto(option.Id, option.Label, option.Text))
                    .ToList()))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Question>> GetMiniQuizQuestionsForEvaluationAsync(
        IReadOnlyCollection<Guid> questionIds,
        CancellationToken cancellationToken = default) =>
        await ApplyPublicQuestionVisibility(context.Questions.AsNoTracking())
            .Where(x => x.AccessLevel == ContentAccessLevel.Free || x.AccessLevel == ContentAccessLevel.Trial)
            .Where(x => questionIds.Contains(x.Id))
            .Include(x => x.Options)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TrialExamSummaryDto>> GetExampleTrialsAsync(
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default) =>
        await context.TrialExams
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                x.ReviewStatus == ReviewStatus.Approved &&
                x.IsPublished &&
                x.AccessLevel == accessLevel)
            .Where(x =>
                x.Questions.Count(question =>
                    question.Question != null &&
                    question.Question.ReviewStatus == ReviewStatus.Approved) >= x.QuestionCount)
            .OrderBy(x => x.Title)
            .Select(x => new TrialExamSummaryDto(
                x.Id,
                x.Title,
                x.Slug,
                x.Description,
                x.LicenseId,
                x.DurationMinutes,
                x.QuestionCount,
                x.IsFree,
                x.IsPublished,
                x.IsFeatured,
                x.DifficultyLevel,
                x.Tags,
                x.PopularityScore,
                x.Questions.Count,
                x.ReviewStatus,
                x.AccessLevel,
                x.ReviewedBy != null ? x.ReviewedBy.Email : null,
                x.ReviewedAt,
                x.ReviewComment))
            .ToListAsync(cancellationToken);

    private static IQueryable<Question> ApplyPublicQuestionVisibility(IQueryable<Question> query) =>
        query.Where(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.Approved);

}
