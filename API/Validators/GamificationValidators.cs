using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class LeaderboardQueryDtoValidator : AbstractValidator<LeaderboardQueryDto>
{
    public LeaderboardQueryDtoValidator()
    {
        RuleFor(x => x.Top)
            .InclusiveBetween(1, 100)
            .WithMessage("Top değeri 1 ile 100 arasında olmalıdır.");
    }
}

public class XpHistoryQueryDtoValidator : AbstractValidator<XpHistoryQueryDto>
{
    public XpHistoryQueryDtoValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0)
            .WithMessage("Page değeri 1 veya daha büyük olmalıdır.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize değeri 1 ile 100 arasında olmalıdır.");
    }
}
