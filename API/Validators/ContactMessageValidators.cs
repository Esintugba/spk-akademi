using API.Dtos;
using API.Entities;
using FluentValidation;

namespace API.Validators;

public class CreateContactMessageValidator : AbstractValidator<CreateContactMessageDto>
{
    public CreateContactMessageValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(x => x.Subject)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(180);

        RuleFor(x => x.Message)
            .NotEmpty()
            .MinimumLength(20)
            .MaximumLength(4000);

        RuleFor(x => x.KvkkAccepted)
            .Equal(true)
            .WithMessage("KVKK aydınlatma metni onayı zorunludur.");

        RuleFor(x => x.Website)
            .MaximumLength(200);

        RuleFor(x => x.CaptchaToken)
            .MaximumLength(2000);
    }
}

public class UpdateContactMessageStatusValidator : AbstractValidator<UpdateContactMessageStatusDto>
{
    public UpdateContactMessageStatusValidator()
    {
        RuleFor(x => x.Status).IsInEnum();

        RuleFor(x => x.AdminNote)
            .MaximumLength(2000);

        RuleFor(x => x.AssignedToUserId)
            .MaximumLength(450);

        RuleFor(x => x.Status)
            .Must(s => s != ContactMessageStatus.Pending)
            .WithMessage("Mesaj tekrar Pending durumuna alınamaz.");
    }
}
