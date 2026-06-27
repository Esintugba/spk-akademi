using API.Dtos;
using API.Entities;
using FluentValidation;

namespace API.Validators;

public class PastExamQuestionQueryValidator : AbstractValidator<PastExamQuestionQueryDto>
{
    public PastExamQuestionQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page 1 veya daha büyük olmalıdır.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize 1 ile 100 arasında olmalıdır.");

        RuleFor(x => x.Years)
            .Must(BeValidYearsCsvOrNull)
            .WithMessage("Years geçersiz veya gelecekte olamaz.");

        RuleFor(x => x.ExamTypes)
            .Must(BeValidExamTypesCsvOrNull)
            .WithMessage("ExamTypes geçersiz.");

        RuleFor(x => x.Session)
            .Must(BeValidSessionOrNull)
            .WithMessage("Session geçersiz.");

        RuleFor(x => x.TopicIds)
            .Must(BeValidGuidCsvOrNull)
            .WithMessage("TopicIds geçersiz.");

        RuleFor(x => x)
            .Must(HaveMeaningfulFilter)
            .WithMessage("Filtre boş olamaz. En az bir filtre seçmelisin (examTypes/years/session/topicIds/difficulty/search).");
    }

    private static bool BeValidYearsCsvOrNull(string? yearsCsv)
    {
        var nowYear = DateTime.UtcNow.Year;
        if (string.IsNullOrWhiteSpace(yearsCsv)) return true;

        var years = SplitCsv(yearsCsv);
        if (years.Count == 0) return true;

        foreach (var token in years)
        {
            if (!int.TryParse(token, out var year)) return false;
            if (year < 1990 || year > nowYear) return false;
        }

        return years.Distinct().Count() == years.Count;
    }

    private static bool BeValidExamTypesCsvOrNull(string? examTypesCsv)
    {
        if (string.IsNullOrWhiteSpace(examTypesCsv)) return true;

        var tokens = SplitCsv(examTypesCsv);
        if (tokens.Count == 0) return true;

        var parsed = new List<ExamType>();
        foreach (var token in tokens)
        {
            if (!Enum.TryParse<ExamType>(token, ignoreCase: true, out var parsedType))
            {
                return false;
            }
            parsed.Add(parsedType);
        }

        return parsed.Distinct().Count() == parsed.Count;
    }

    private static bool BeValidSessionOrNull(string? session)
    {
        if (string.IsNullOrWhiteSpace(session)) return true;
        return Enum.TryParse<ExamSession>(session, ignoreCase: true, out _);
    }

    private static bool BeValidGuidCsvOrNull(string? guidsCsv)
    {
        if (string.IsNullOrWhiteSpace(guidsCsv)) return true;
        var tokens = SplitCsv(guidsCsv);
        if (tokens.Count == 0) return true;
        var parsed = new List<Guid>();
        foreach (var token in tokens)
        {
            if (!Guid.TryParse(token, out var guid))
            {
                return false;
            }
            parsed.Add(guid);
        }

        return parsed.Distinct().Count() == parsed.Count;
    }

    private static bool HaveMeaningfulFilter(PastExamQuestionQueryDto query)
    {
        return !string.IsNullOrWhiteSpace(query.ExamTypes)
               || !string.IsNullOrWhiteSpace(query.Years)
               || !string.IsNullOrWhiteSpace(query.Session)
               || !string.IsNullOrWhiteSpace(query.TopicIds)
               || query.Difficulty.HasValue
               || !string.IsNullOrWhiteSpace(query.Search);
    }

    private static List<string> SplitCsv(string csv) =>
        csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
}

