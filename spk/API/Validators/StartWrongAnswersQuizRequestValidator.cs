using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class StartWrongAnswersQuizRequestValidator : AbstractValidator<StartWrongAnswersQuizRequestDto>
{
    public StartWrongAnswersQuizRequestValidator()
    {
        RuleFor(x => x.QuestionCount)
            .InclusiveBetween(5, 100)
            .WithMessage("Soru sayısı 5 ile 100 arasında olmalıdır.");
    }
}
