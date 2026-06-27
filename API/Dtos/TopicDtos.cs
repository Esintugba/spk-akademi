using API.Entities;

namespace API.Dtos;

public record TopicDto(
    Guid Id,
    Guid CourseId,
    Guid? ParentTopicId,
    string? ParentTopicTitle,
    TopicType Type,
    string Title,
    string Slug,
    int Order,
    int Level,
    string? Summary,
    string? ImportantPoints,
    string? CommonMistakes,
    string? Formulas,
    string? ExamNotes,
    string? CriticalThresholds,
    int SubTopicCount,
    int QuestionCount);

public record CreateTopicDto(
    Guid CourseId,
    Guid? ParentTopicId,
    TopicType? Type,
    string Title,
    string Slug,
    int Order,
    string? Summary,
    string? ImportantPoints,
    string? CommonMistakes,
    string? Formulas,
    string? ExamNotes,
    string? CriticalThresholds);

public record UpdateTopicDto(
    Guid CourseId,
    Guid? ParentTopicId,
    TopicType? Type,
    string Title,
    string Slug,
    int Order,
    string? Summary,
    string? ImportantPoints,
    string? CommonMistakes,
    string? Formulas,
    string? ExamNotes,
    string? CriticalThresholds);
