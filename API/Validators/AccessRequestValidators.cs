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
    }
}
