using API.Dtos;
using FluentValidation;

namespace API.Validators;

public class MaterialProgressDtoValidator : AbstractValidator<MaterialProgressDto>
{
    public MaterialProgressDtoValidator()
    {
        RuleFor(x => x.MaterialId)
            .NotEmpty()
            .WithMessage("MaterialId zorunludur.");

        RuleFor(x => x.LastPage)
            .GreaterThanOrEqualTo(1)
            .WithMessage("LastPage 1 veya daha büyük olmalıdır.");

        RuleFor(x => x.ProgressPercentage)
            .InclusiveBetween(0, 100)
            .WithMessage("ProgressPercentage 0 ile 100 arasında olmalıdır.");

        RuleFor(x => x.SecondsReadDelta)
            .Must(x => x is null || x >= 0)
            .WithMessage("SecondsReadDelta negatif olamaz.");
    }
}

public class CreateMaterialBookmarkDtoValidator : AbstractValidator<CreateMaterialBookmarkDto>
{
    public CreateMaterialBookmarkDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageNumber 1 veya daha büyük olmalıdır.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200)
            .WithMessage("Bookmark başlığı zorunlu ve 200 karakteri geçemez.");
    }
}

public class CreateMaterialNoteDtoValidator : AbstractValidator<CreateMaterialNoteDto>
{
    public CreateMaterialNoteDtoValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageNumber 1 veya daha büyük olmalıdır.");

        RuleFor(x => x.Note)
            .NotEmpty()
            .MaximumLength(1500)
            .WithMessage("Note zorunlu ve 1500 karakteri geçemez.");

        RuleFor(x => x.SelectedText)
            .Must(x => string.IsNullOrWhiteSpace(x) || x.Length <= 1200)
            .WithMessage("SelectedText 1200 karakteri geçemez.");
    }
}

public class UpdateMaterialNoteDtoValidator : AbstractValidator<UpdateMaterialNoteDto>
{
    public UpdateMaterialNoteDtoValidator()
    {
        RuleFor(x => x.Note)
            .Must(x => x is null || x.Length <= 1500)
            .WithMessage("Note 1500 karakteri geçemez.");
    }
}

