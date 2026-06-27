using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Repositories;

public class LicenseCatalogRepository(DataContext context) : ILicenseCatalogRepository
{
    public async Task<IReadOnlyList<LicenseCatalogDto>> GetActiveCatalogAsync(CancellationToken cancellationToken = default)
    {
        var averageScores = await context.QuizAttempts
            .AsNoTracking()
            .Where(attempt =>
                attempt.TrialExam != null &&
                attempt.TrialExam.LicenseId.HasValue &&
                attempt.TotalQuestions > 0 &&
                (attempt.Status == QuizAttemptStatus.Completed || attempt.FinishedAt.HasValue))
            .GroupBy(attempt => attempt.TrialExam!.LicenseId!.Value)
            .Select(group => new
            {
                LicenseId = group.Key,
                AverageScore = group.Average(attempt => (double)attempt.CorrectCount / attempt.TotalQuestions * 100)
            })
            .ToDictionaryAsync(
                x => x.LicenseId,
                x => (decimal)x.AverageScore,
                cancellationToken);

        var licenses = await context.Licenses
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.ShortDescription,
                x.IconUrl,
                x.DisplayOrder,
                x.EstimatedStudyHours,
                x.IsActive,
                x.IsFeatured,
                Courses = x.Courses
                    .OrderBy(course => course.Order)
                    .ThenBy(course => course.Name)
                    .Select(course => new LicenseCourseSummaryDto(
                        course.Id,
                        course.Name,
                        course.Slug,
                        course.Description,
                        course.Order,
                        course.Topics.Count,
                        course.Topics.SelectMany(topic => topic.Questions)
                            .Count(question => !question.IsDeleted && question.ReviewStatus == ReviewStatus.Approved),
                        course.SourceDocuments.Count(material =>
                            !material.IsDeleted && material.ReviewStatus == ReviewStatus.Approved)))
                    .ToList(),
                QuizCount = context.TrialExams.Count(quiz =>
                    quiz.LicenseId == x.Id &&
                    !quiz.IsDeleted &&
                    quiz.IsPublished &&
                    quiz.ReviewStatus == ReviewStatus.Approved),
                Quizzes = context.TrialExams
                    .Where(quiz =>
                        quiz.LicenseId == x.Id &&
                        !quiz.IsDeleted &&
                        quiz.IsPublished &&
                        quiz.ReviewStatus == ReviewStatus.Approved)
                    .OrderByDescending(quiz => quiz.IsFeatured)
                    .ThenByDescending(quiz => quiz.PopularityScore)
                    .ThenBy(quiz => quiz.Title)
                    .Select(quiz => new LicenseQuizSummaryDto(
                        quiz.Id,
                        quiz.Title,
                        quiz.Slug,
                        quiz.QuestionCount,
                        quiz.DurationMinutes * 60))
                    .ToList(),
                EnrolledStudentCount = context.UserLicenseAccesses.Count(access => access.LicenseId == x.Id),
                ActiveStudentCount = context.UserLicenseAccesses.Count(access =>
                    access.LicenseId == x.Id &&
                    access.IsActive &&
                    (access.ExpiresAt == null || access.ExpiresAt > DateTime.UtcNow))
            })
            .ToListAsync(cancellationToken);

        return licenses.Select(x =>
        {
            var topicCount = x.Courses.Sum(course => course.TopicCount);
            var questionCount = x.Courses.Sum(course => course.QuestionCount);
            var materialCount = x.Courses.Sum(course => course.MaterialCount);

            return new LicenseCatalogDto(
                x.Id,
                x.Name,
                x.Slug,
                x.Description,
                x.ShortDescription,
                x.IconUrl,
                x.DisplayOrder,
                x.Courses.Count,
                topicCount,
                questionCount,
                x.QuizCount,
                materialCount,
                x.EstimatedStudyHours,
                x.IsActive,
                x.IsFeatured,
                false,
                x.Courses,
                x.Quizzes,
                new LicenseCatalogAnalyticsDto(
                    x.EnrolledStudentCount,
                    x.ActiveStudentCount,
                    Math.Round(averageScores.GetValueOrDefault(x.Id), 1)));
        }).ToList();
    }

    public async Task<LicenseCatalogDto?> GetActiveCatalogBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var catalog = await GetActiveCatalogAsync(cancellationToken);
        return catalog.FirstOrDefault(x => string.Equals(x.Slug, slug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<LicenseCatalogDto?> GetActiveCatalogByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var catalog = await GetActiveCatalogAsync(cancellationToken);
        return catalog.FirstOrDefault(x => x.Id == id);
    }
}
