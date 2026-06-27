using API.Entities;

namespace API.Repositories;

public interface ITrialExamRepository
{
    Task<IReadOnlyList<TrialExam>> GetAllForManagementAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrialExam>> GetFreePublishedAsync(CancellationToken cancellationToken = default);

    Task<TrialExam?> GetByIdForDetailAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TrialExam?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<TrialExam?> GetActiveTrialForStartAsync(Guid trialExamId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TrialExam>> GetAccessibleTrialsAsync(
        string userId,
        IReadOnlyList<Guid> activeLicenseIds,
        IReadOnlyList<Guid> purchasedTrialIds,
        CancellationToken cancellationToken = default);

    Task<bool> HasActivePurchaseAsync(
        string userId,
        Guid trialExamId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> GetPurchasedTrialIdsAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<bool> LicenseExistsAsync(Guid licenseId, CancellationToken cancellationToken = default);

    Task<int> CountExistingQuestionsAsync(
        IReadOnlyCollection<Guid> questionIds,
        CancellationToken cancellationToken = default);

    Task AddAsync(TrialExam exam, CancellationToken cancellationToken = default);

    void RemoveQuestions(IEnumerable<TrialExamQuestion> questions);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
