using API.Entities;

namespace API.Dtos;

public record PastExamYearRateDto(
    int Year,
    decimal CorrectRate,
    int TotalSolved);

public record PastExamExamTypeRateDto(
    ExamType ExamType,
    decimal CorrectRate,
    int TotalSolved);

public record PastExamWeakTopicRateDto(
    Guid TopicId,
    string TopicTitle,
    decimal CorrectRate,
    int TotalSolved);

public record PastExamAnalyticsDto(
    int TotalSolved,
    decimal CorrectRate,
    IReadOnlyList<int> StrongYears,
    IReadOnlyList<int> WeakYears,
    ExamType? BestExamType,
    string? WorstTopic,
    IReadOnlyList<PastExamYearRateDto> YearRates,
    IReadOnlyList<PastExamExamTypeRateDto> ExamTypeRates,
    IReadOnlyList<PastExamWeakTopicRateDto> WeakTopics);

