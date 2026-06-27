using API.Dtos;

namespace API.Services;

public interface IQuizRecommendationService
{
    Task<IReadOnlyList<FeaturedQuizDto>> GetRecommendedAsync(
        string userId,
        CancellationToken cancellationToken = default);
}

public class QuizRecommendationService(IQuizCatalogService quizCatalogService) : IQuizRecommendationService
{
    public async Task<IReadOnlyList<FeaturedQuizDto>> GetRecommendedAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var featured = await quizCatalogService.GetFeaturedAsync(userId, cancellationToken);

        return featured
            .OrderByDescending(x => x.AverageScore)
            .ThenByDescending(x => x.PopularityScore)
            .Take(8)
            .ToList();
    }
}
