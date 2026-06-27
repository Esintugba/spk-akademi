using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class QuestionImportRowValidator : AbstractValidator<QuestionImportRowDto>
{
    public QuestionImportRowValidator()
    {
        RuleFor(x => x.QuestionText).NotEmpty().MinimumLength(10).MaximumLength(4000);
        RuleFor(x => x.CorrectOption).NotEmpty().Must(x => "ABCDE".Contains(x.Trim().ToUpperInvariant()));
        RuleFor(x => x.Topic).NotEmpty().MaximumLength(250);
        RuleFor(x => x.Course).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Explanation).MaximumLength(4000);
        RuleFor(x => x.ExamYear).InclusiveBetween(1990, 2100).When(x => x.ExamYear.HasValue);

        RuleFor(x => x)
            .Must(HasAtLeastTwoOptions)
            .WithMessage("En az iki seçenek zorunludur.");

        RuleFor(x => x)
            .Must(HasCorrectOptionText)
            .WithMessage("CorrectOption değeri dolu bir seçeneği işaret etmelidir.");

        RuleFor(x => x)
            .Must(HasUniqueOptions)
            .WithMessage("Seçenek metinleri benzersiz olmalıdır.");
    }

    private static bool HasAtLeastTwoOptions(QuestionImportRowDto row) =>
        GetOptions(row).Count(x => !string.IsNullOrWhiteSpace(x.Value)) >= 2;

    private static bool HasCorrectOptionText(QuestionImportRowDto row)
    {
        var correct = row.CorrectOption.Trim().ToUpperInvariant();
        return GetOptions(row).Any(x => x.Label == correct && !string.IsNullOrWhiteSpace(x.Value));
    }

    private static bool HasUniqueOptions(QuestionImportRowDto row)
    {
        var options = GetOptions(row)
            .Select(x => x.Value?.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.ToLowerInvariant())
            .ToList();

        return options.Distinct().Count() == options.Count;
    }

    private static IReadOnlyList<(string Label, string? Value)> GetOptions(QuestionImportRowDto row) =>
    [
        ("A", row.OptionA),
        ("B", row.OptionB),
        ("C", row.OptionC),
        ("D", row.OptionD),
        ("E", row.OptionE)
    ];
}
