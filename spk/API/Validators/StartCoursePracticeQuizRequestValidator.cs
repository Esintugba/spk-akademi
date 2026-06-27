using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class StartCoursePracticeQuizRequestValidator : AbstractValidator<StartCoursePracticeQuizRequestDto>
{
    public StartCoursePracticeQuizRequestValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage("CourseId zorunludur.");

        RuleFor(x => x.QuestionCount)
            .InclusiveBetween(5, 100)
            .WithMessage("Soru sayısı 5 ile 100 arasında olmalıdır.");

        RuleFor(x => x.TopicIds)
            .Must(ids => ids is null || ids.Distinct().Count() == ids.Count)
            .WithMessage("TopicIds içinde tekrar eden kayıt olamaz.");
    }
}
