using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class StartLicensedQuizRequestValidator : AbstractValidator<StartLicensedQuizRequestDto>
{
    public StartLicensedQuizRequestValidator()
    {
        RuleFor(x => x.QuizId)
            .NotEmpty()
            .WithMessage("QuizId zorunludur.");
    }
}
