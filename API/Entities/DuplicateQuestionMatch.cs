namespace API.Entities;

public class DuplicateQuestionMatch : BaseEntity
{
    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public Guid MatchedQuestionId { get; set; }

    public Question? MatchedQuestion { get; set; }

    public decimal SimilarityScore { get; set; }

    public DuplicateMatchType MatchType { get; set; }
}
