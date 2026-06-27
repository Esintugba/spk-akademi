using API.Dtos;
using API.Entities;
using FluentValidation;

namespace API.Validators;

public class QuizCatalogQueryValidator : AbstractValidator<QuizCatalogQueryDto>
{
    private static readonly string[] Statuses =
    [
        "available",
        "completed",
        "in-progress",
        "inprogress",
        "incomplete",
        "not-completed",
        "notcompleted"
    ];

    private static readonly string[] Sorts =
    [
        "newest",
        "popular",
        "highest-rated",
        "highestrated",
        "shortest-duration",
        "shortestduration",
        "highest-success-rate",
        "highestsuccessrate"
    ];

    public QuizCatalogQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0)
            .WithMessage("Page 1 veya daha büyük olmalıdır.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize 1 ile 50 arasında olmalıdır.");

        RuleFor(x => x.Status)
            .Must(BeKnownStatus)
            .WithMessage("Status değeri desteklenmiyor.")
            .When(x => !string.IsNullOrWhiteSpace(x.Status));

        RuleFor(x => x.SortBy)
            .Must(BeKnownSort)
            .WithMessage("SortBy değeri desteklenmiyor.")
            .When(x => !string.IsNullOrWhiteSpace(x.SortBy));

        RuleFor(x => x.Difficulty)
            .Must(BeKnownDifficulty)
            .WithMessage("Difficulty easy, medium veya hard olmalıdır.")
            .When(x => !string.IsNullOrWhiteSpace(x.Difficulty));
    }

    private static bool BeKnownStatus(string? value) =>
        value is not null && Statuses.Contains(value.Trim().ToLowerInvariant());

    private static bool BeKnownSort(string? value) =>
        value is not null && Sorts.Contains(value.Trim().ToLowerInvariant());

    private static bool BeKnownDifficulty(string? value) =>
        Enum.TryParse<QuestionDifficulty>(value, true, out _) ||
        (int.TryParse(value, out var numeric) && Enum.IsDefined(typeof(QuestionDifficulty), numeric));
}
