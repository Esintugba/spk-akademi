using API.Entities;

namespace API.Repositories;

public interface ICoursePracticeRepository
{
    Task<Course?> GetCourseAsync(Guid courseId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Question>> GetQuestionPoolAsync(
        Guid courseId,
        IReadOnlyList<Guid>? topicIds,
        IReadOnlyList<QuestionDifficulty>? difficultyLevels,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> GetWrongQuestionIdsForCourseAsync(
        string userId,
        Guid courseId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CoursePracticeCourseRow>> GetAccessibleCoursesAsync(
        string userId,
        IReadOnlyList<Guid> accessibleLicenseIds,
        CancellationToken cancellationToken = default);
}

public sealed class CoursePracticeCourseRow
{
    public Guid CourseId { get; init; }

    public Guid LicenseId { get; init; }

    public string LicenseName { get; init; } = string.Empty;

    public string CourseName { get; init; } = string.Empty;

    public int TopicCount { get; init; }

    public int TotalQuestionCount { get; init; }

    public int CorrectCount { get; init; }

    public int WrongCount { get; init; }

    public int StudiedTopicCount { get; init; }

    public int TotalTopicCount { get; init; }
}
