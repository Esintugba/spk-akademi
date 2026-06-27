using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class CompleteOnboardingValidator : AbstractValidator<CompleteOnboardingDto>
{
    public CompleteOnboardingValidator()
    {
        RuleFor(x => x.CurrentStep)
            .InclusiveBetween(0, 10)
            .When(x => x.CurrentStep.HasValue);
    }
}
