using API.Dtos;
using API.Entities;
using API.Repositories;

namespace API.Services;

public interface IPublicContentService
{
    Task<IReadOnlyList<PublicQuestionDto>> GetQuestionBankAsync(
        Guid? topicId,
        string? search,
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PublicQuestionDto>> StartMiniQuizAsync(
        StartPublicMiniQuizDto dto,
        CancellationToken cancellationToken = default);

    Task<PublicMiniQuizResultDto> SubmitMiniQuizAsync(
        SubmitPublicMiniQuizDto dto,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrialExamSummaryDto>> GetExampleTrialsAsync(
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default);
}

public class PublicContentService(IPublicContentRepository publicContent) : IPublicContentService
{
    public Task<IReadOnlyList<PublicQuestionDto>> GetQuestionBankAsync(
        Guid? topicId,
        string? search,
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default) =>
        publicContent.GetQuestionBankAsync(topicId, search, accessLevel, cancellationToken);

    public Task<IReadOnlyList<PublicQuestionDto>> StartMiniQuizAsync(
        StartPublicMiniQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        var count = Math.Clamp(dto.QuestionCount, 1, 20);
        return publicContent.GetMiniQuizQuestionsAsync(count, dto.AccessLevel, cancellationToken);
    }

    public async Task<PublicMiniQuizResultDto> SubmitMiniQuizAsync(
        SubmitPublicMiniQuizDto dto,
        CancellationToken cancellationToken = default)
    {
        var questionIds = dto.Answers.Select(x => x.QuestionId).Distinct().ToList();
        var questions = await publicContent.GetMiniQuizQuestionsForEvaluationAsync(questionIds, cancellationToken);

        var resultAnswers = questions.Select(question =>
        {
            var answer = dto.Answers.FirstOrDefault(x => x.QuestionId == question.Id);
            var correctOptionId = question.Options.Single(x => x.IsCorrect).Id;

            return new PublicMiniQuizResultAnswerDto(
                question.Id,
                answer?.SelectedOptionId,
                answer?.SelectedOptionId == correctOptionId,
                question.Explanation);
        }).ToList();

        var correctCount = resultAnswers.Count(x => x.IsCorrect);
        var wrongCount = resultAnswers.Count - correctCount;
        var totalQuestions = resultAnswers.Count;
        var successRate = totalQuestions == 0
            ? 0
            : Math.Round((decimal)correctCount / totalQuestions * 100, 1);

        return new PublicMiniQuizResultDto(
            totalQuestions,
            correctCount,
            wrongCount,
            successRate,
            resultAnswers);
    }

    public Task<IReadOnlyList<TrialExamSummaryDto>> GetExampleTrialsAsync(
        ContentAccessLevel accessLevel,
        CancellationToken cancellationToken = default) =>
        publicContent.GetExampleTrialsAsync(accessLevel, cancellationToken);
}
