using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class StartPastExamQuizRequestValidator : AbstractValidator<StartPastExamQuizRequestDto>
{
    public StartPastExamQuizRequestValidator()
    {
        RuleFor(x => x.QuestionCount)
            .InclusiveBetween(5, 100)
            .WithMessage("Soru sayısı 5 ile 100 arasında olmalıdır.");

        RuleFor(x => x.OnlyPastExamQuestions)
            .Equal(true)
            .WithMessage("Bu endpoint yalnızca çıkmış sorular için kullanılabilir (onlyPastExamQuestions=true).");

        RuleFor(x => x.ExamTypes)
            .Must(x => x is null || x.Distinct().Count() == x.Count)
            .WithMessage("ExamTypes içinde tekrar eden kayıt olamaz.");

        RuleFor(x => x.Years)
            .Must(BeValidYearsOrNull)
            .WithMessage("Years geçersiz veya gelecekte olamaz.");

        RuleFor(x => x.TopicIds)
            .Must(x => x is null || x.Distinct().Count() == x.Count)
            .WithMessage("TopicIds içinde tekrar eden kayıt olamaz.");

        RuleFor(x => x)
            .Must(HaveMeaningfulFilter)
            .WithMessage("Filtre boş olamaz. En az bir filtre seçmelisin (examTypes/years/session/topicIds/difficulty).");
    }

    private static bool HaveMeaningfulFilter(StartPastExamQuizRequestDto dto) =>
        (dto.ExamTypes?.Count ?? 0) > 0 ||
        (dto.Years?.Count ?? 0) > 0 ||
        (dto.TopicIds?.Count ?? 0) > 0 ||
        dto.Session.HasValue ||
        dto.Difficulty.HasValue;

    private static bool BeValidYearsOrNull(IReadOnlyList<int>? years)
    {
        if (years is null || years.Count == 0) return true;
        var nowYear = DateTime.UtcNow.Year;
        return years.All(year => year >= 1990 && year <= nowYear);
    }
}

