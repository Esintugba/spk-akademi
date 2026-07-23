using API.Dtos;
using API.Entities;
using FluentValidation;

namespace API.Validators;

public class CreateAccessRequestValidator : AbstractValidator<CreateAccessRequestDto>
{
    public CreateAccessRequestValidator()
    {
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.Message).MaximumLength(2000);
    }
}

public class UpdateAccessRequestStatusValidator : AbstractValidator<UpdateAccessRequestStatusDto>
{
    public UpdateAccessRequestStatusValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => s is AccessRequestStatus.Approved or AccessRequestStatus.Rejected or AccessRequestStatus.Waitlisted)
            .WithMessage("Geçersiz durum. Yalnızca Approved, Rejected veya Waitlisted atanabilir.");

        RuleFor(x => x.AdminNote).MaximumLength(2000);
        RuleFor(x => x.AdminNote)
            .Must(note => !string.IsNullOrWhiteSpace(note))
            .When(x => x.Status == AccessRequestStatus.Rejected)
            .WithMessage("Ret işlemi için admin notu zorunludur.");
    }
}

public class CorrectAccessRequestDecisionValidator : AbstractValidator<CorrectAccessRequestDecisionDto>
{
    public CorrectAccessRequestDecisionValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => s is AccessRequestStatus.Approved or AccessRequestStatus.Rejected)
            .WithMessage("Karar yalnızca Approved veya Rejected olarak düzeltilebilir.");

        RuleFor(x => x.AdminNote).MaximumLength(2000);
        RuleFor(x => x.AdminNote)
            .Must(note => !string.IsNullOrWhiteSpace(note))
            .When(x => x.Status == AccessRequestStatus.Rejected)
            .WithMessage("Ret işlemi için admin notu zorunludur.");

        RuleFor(x => x.CorrectionReason)
            .Must(reason => !string.IsNullOrWhiteSpace(reason))
            .WithMessage("Karar düzeltme gerekçesi zorunludur.");
        RuleFor(x => x.CorrectionReason).MaximumLength(2000);
    }
}
