using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class StartReviewSessionRequestValidator : AbstractValidator<StartReviewSessionRequestDto>
{
    public StartReviewSessionRequestValidator()
    {
        RuleFor(x => x.MaxQuestions).InclusiveBetween(1, 50);
    }
}

public class SubmitReviewSessionValidator : AbstractValidator<SubmitReviewSessionDto>
{
    public SubmitReviewSessionValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.Answers).NotEmpty().WithMessage("En az bir cevap gönderilmelidir.");
        RuleForEach(x => x.Answers).SetValidator(new SubmitReviewAnswerValidator());
    }
}

public class SubmitReviewAnswerValidator : AbstractValidator<SubmitReviewAnswerDto>
{
    public SubmitReviewAnswerValidator()
    {
        RuleFor(x => x.QuestionId).NotEmpty();
        RuleFor(x => x.Quality).InclusiveBetween(0, 5);
        RuleFor(x => x.ResponseTimeSeconds)
            .GreaterThanOrEqualTo(0)
            .When(x => x.ResponseTimeSeconds.HasValue);
    }
}
