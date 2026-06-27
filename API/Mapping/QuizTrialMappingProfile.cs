using API.Dtos;
using API.Entities;
using AutoMapper;

namespace API.Mapping;

public class QuizTrialMappingProfile : Profile
{
    public QuizTrialMappingProfile()
    {
        CreateMap<QuizAttempt, QuizAttemptResponseDto>()
            .ForMember(dest => dest.AttemptId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.QuizId, opt => opt.MapFrom(src => src.TrialExamId ?? Guid.Empty))
            .ForMember(dest => dest.RemainingTime, opt => opt.MapFrom(src => ResolveRemainingTime(src)))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ResolveStatus(src)));
    }

    private static int ResolveRemainingTime(QuizAttempt attempt)
    {
        if (attempt.TrialExam is null || attempt.FinishedAt.HasValue)
        {
            return 0;
        }

        var expiresAt = attempt.StartedAt.AddMinutes(attempt.TrialExam.DurationMinutes);
        return (int)Math.Max(0, (expiresAt - DateTime.UtcNow).TotalSeconds);
    }

    private static QuizAttemptStatus ResolveStatus(QuizAttempt attempt)
    {
        if (attempt.FinishedAt.HasValue || attempt.Status == QuizAttemptStatus.Completed)
        {
            return QuizAttemptStatus.Completed;
        }

        if (attempt.TrialExam is not null &&
            DateTime.UtcNow > attempt.StartedAt.AddMinutes(attempt.TrialExam.DurationMinutes))
        {
            return QuizAttemptStatus.Expired;
        }

        return attempt.Status is QuizAttemptStatus.NotStarted
            ? QuizAttemptStatus.Started
            : attempt.Status;
    }
}
