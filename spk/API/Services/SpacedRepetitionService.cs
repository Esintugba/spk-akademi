namespace API.Services;

public interface ISpacedRepetitionService
{
    DateTime CalculateNextReviewAt(int reviewCount, DateTime fromUtc);

    bool ShouldMarkMastered(int reviewCount, bool lastAnswerCorrect);
}

public class SpacedRepetitionService : ISpacedRepetitionService
{
    public DateTime CalculateNextReviewAt(int reviewCount, DateTime fromUtc) =>
        reviewCount switch
        {
            <= 0 => fromUtc.AddDays(1),
            1 => fromUtc.AddDays(1),
            2 => fromUtc.AddDays(3),
            3 => fromUtc.AddDays(7),
            _ => fromUtc.AddDays(14)
        };

    public bool ShouldMarkMastered(int reviewCount, bool lastAnswerCorrect) =>
        lastAnswerCorrect && reviewCount >= 4;
}
