using API.Dtos;
using API.Repositories;

namespace API.Services;

public interface IPastExamService
{
    Task<PastExamQuestionListResponseDto> GetPastExamQuestionsAsync(
        PastExamQuestionFilterDto filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

public class PastExamService(IPastExamRepository pastExamRepository) : IPastExamService
{
    public async Task<PastExamQuestionListResponseDto> GetPastExamQuestionsAsync(
        PastExamQuestionFilterDto filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await pastExamRepository.GetPastExamQuestionsAsync(
            filter,
            page,
            pageSize,
            cancellationToken);

        return new PastExamQuestionListResponseDto(items, total, page, pageSize);
    }
}

