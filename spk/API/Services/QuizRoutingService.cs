using API.Entities;

namespace API.Services;

public interface IQuizRoutingService
{
    QuizMode ResolveEffectiveMode(QuizAttempt attempt, TrialExam? trialExam);

    string BuildRoute(QuizMode effectiveMode, Guid attemptId);

    string BuildReviewSessionRoute(Guid reviewSessionId);

    TimeSpan GetSessionTimeout(QuizMode effectiveMode, int? trialDurationMinutes);
}

public class QuizRoutingService : IQuizRoutingService
{
    public QuizMode ResolveEffectiveMode(QuizAttempt attempt, TrialExam? trialExam)
    {
        if (attempt.Mode == QuizMode.TrialExam)
        {
            return trialExam?.IsFree == true ? QuizMode.FreeTrial : QuizMode.LicensedQuiz;
        }

        return attempt.Mode;
    }

    public string BuildRoute(QuizMode effectiveMode, Guid attemptId) =>
        effectiveMode switch
        {
            QuizMode.FreeTrial => $"/quiz/free/{attemptId}",
            QuizMode.LicensedQuiz => $"/quiz/licensed/{attemptId}",
            QuizMode.CoursePractice => $"/quiz/course-practice/{attemptId}",
            QuizMode.WrongAnswers => $"/quiz/wrong-answers/{attemptId}",
            QuizMode.MixedPractice => $"/quiz/mixed/{attemptId}",
            QuizMode.TopicPractice => $"/quiz/topic/{attemptId}",
            QuizMode.MockExam => $"/quiz/mock/{attemptId}",
            QuizMode.TrialExam => $"/quiz/licensed/{attemptId}",
            _ => $"/quiz/session/{attemptId}"
        };

    public string BuildReviewSessionRoute(Guid reviewSessionId) =>
        $"/reviews/session/{reviewSessionId}";

    public TimeSpan GetSessionTimeout(QuizMode effectiveMode, int? trialDurationMinutes)
    {
        if (trialDurationMinutes.HasValue && trialDurationMinutes.Value > 0)
        {
            return TimeSpan.FromMinutes(trialDurationMinutes.Value);
        }

        return effectiveMode switch
        {
            QuizMode.FreeTrial => TimeSpan.FromHours(2),
            QuizMode.LicensedQuiz => TimeSpan.FromHours(3),
            QuizMode.MockExam => TimeSpan.FromHours(4),
            QuizMode.TrialExam => TimeSpan.FromHours(3),
            QuizMode.CoursePractice => TimeSpan.FromHours(2),
            QuizMode.WrongAnswers => TimeSpan.FromHours(2),
            QuizMode.TopicPractice => TimeSpan.FromHours(2),
            QuizMode.MixedPractice => TimeSpan.FromHours(2),
            _ => TimeSpan.FromHours(2)
        };
    }
}
