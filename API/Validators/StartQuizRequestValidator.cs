using API.Dtos;
using API.Entities;
using FluentValidation;

namespace API.Validators;

public class StartQuizRequestValidator : AbstractValidator<StartQuizDto>
{
    public StartQuizRequestValidator()
    {
        RuleFor(x => x.Mode)
            .Must(mode => mode is QuizMode.TopicPractice or QuizMode.MixedPractice)
            .WithMessage("Standart test başlangıcı yalnızca konu pratiği veya karma pratik modunu destekler.");

        RuleFor(x => x.QuestionCount)
            .InclusiveBetween(1, 100)
            .WithMessage("Soru sayısı 1 ile 100 arasında olmalıdır.");

        RuleFor(x => x.TopicId)
            .NotNull()
            .When(x => x.Mode == QuizMode.TopicPractice)
            .WithMessage("Konu pratiği için TopicId zorunludur.");
    }
}
