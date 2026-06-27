using API.Entities;
using Microsoft.AspNetCore.Identity;

namespace API.Services;

public interface IContentReviewQueryService
{
    IQueryable<Question> ApplyQuestionVisibility(IQueryable<Question> query, AppUser? user);

    IQueryable<StudyNote> ApplyStudyNoteVisibility(IQueryable<StudyNote> query, AppUser? user);

    IQueryable<SourceDocument> ApplySourceDocumentVisibility(IQueryable<SourceDocument> query, AppUser? user);

    IQueryable<TrialExam> ApplyTrialExamVisibility(IQueryable<TrialExam> query, AppUser? user);
}

public class ContentReviewQueryService(UserManager<AppUser> userManager) : IContentReviewQueryService
{
    public IQueryable<Question> ApplyQuestionVisibility(IQueryable<Question> query, AppUser? user)
    {
        return IsAdmin(user) ? query : query.Where(x => x.ReviewStatus == ReviewStatus.Approved);
    }

    public IQueryable<StudyNote> ApplyStudyNoteVisibility(IQueryable<StudyNote> query, AppUser? user)
    {
        return ApplyModerationVisibility(query, user);
    }

    public IQueryable<SourceDocument> ApplySourceDocumentVisibility(IQueryable<SourceDocument> query, AppUser? user)
    {
        return ApplyModerationVisibility(query, user);
    }

    public IQueryable<TrialExam> ApplyTrialExamVisibility(IQueryable<TrialExam> query, AppUser? user)
    {
        return ApplyModerationVisibility(query, user);
    }

    private IQueryable<T> ApplyModerationVisibility<T>(IQueryable<T> query, AppUser? user) where T : ModeratedEntity
    {
        return IsAdmin(user)
            ? query.Where(x => !x.IsDeleted)
            : query.Where(x => !x.IsDeleted && x.ReviewStatus == ReviewStatus.Approved);
    }

    private bool IsAdmin(AppUser? user)
    {
        return user is not null && userManager.IsInRoleAsync(user, AppRoles.Admin).GetAwaiter().GetResult();
    }
}
