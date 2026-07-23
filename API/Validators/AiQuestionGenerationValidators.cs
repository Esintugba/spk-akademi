using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class CreateAiQuestionGenerationJobValidator : AbstractValidator<CreateAiQuestionGenerationJobDto>
{
    public CreateAiQuestionGenerationJobValidator()
    {
        RuleFor(x => x.SourceDocumentId).NotEmpty();
        RuleFor(x => x.TopicId).NotEmpty();
        RuleFor(x => x.StartPage).GreaterThanOrEqualTo(1);
        RuleFor(x => x.EndPage).GreaterThanOrEqualTo(x => x.StartPage);
        RuleFor(x => x.EasyQuestionCount).InclusiveBetween(0, 50);
        RuleFor(x => x.MediumQuestionCount).InclusiveBetween(0, 50);
        RuleFor(x => x.HardQuestionCount).InclusiveBetween(0, 50);
        RuleFor(x => x)
            .Must(x => x.EasyQuestionCount + x.MediumQuestionCount + x.HardQuestionCount is >= 1 and <= 50)
            .WithMessage("Toplam soru sayısı 1 ile 50 arasında olmalıdır.");
    }
}

public class UpdateAiQuestionDraftValidator : AbstractValidator<UpdateAiQuestionDraftDto>
{
    public UpdateAiQuestionDraftValidator()
    {
        RuleFor(x => x.QuestionText).NotEmpty().MinimumLength(10).MaximumLength(4000);
        RuleFor(x => x.OptionA).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.OptionB).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.OptionC).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.OptionD).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.OptionE).MaximumLength(2000);
        RuleFor(x => x.CorrectOption).NotEmpty().Matches("^[A-E]$");
        RuleFor(x => x.Explanation).MaximumLength(4000);
        RuleFor(x => x.Difficulty).IsInEnum();
        RuleFor(x => x.SourcePage).GreaterThanOrEqualTo(1);
        RuleFor(x => x.SourceExcerpt).NotEmpty().MaximumLength(4000);
        RuleFor(x => x)
            .Must(HasCorrectOption)
            .WithMessage("Doğru seçenek dolu bir seçeneği göstermelidir.");
    }

    private static bool HasCorrectOption(UpdateAiQuestionDraftDto dto) =>
        dto.CorrectOption.Trim().ToUpperInvariant() switch
        {
            "A" => !string.IsNullOrWhiteSpace(dto.OptionA),
            "B" => !string.IsNullOrWhiteSpace(dto.OptionB),
            "C" => !string.IsNullOrWhiteSpace(dto.OptionC),
            "D" => !string.IsNullOrWhiteSpace(dto.OptionD),
            "E" => !string.IsNullOrWhiteSpace(dto.OptionE),
            _ => false
        };
}

public class PublishAiQuestionDraftsValidator : AbstractValidator<PublishAiQuestionDraftsDto>
{
    public PublishAiQuestionDraftsValidator()
    {
        RuleFor(x => x.DraftIds).NotEmpty().Must(x => x.Count <= 100);
        RuleForEach(x => x.DraftIds).NotEmpty();
    }
}
