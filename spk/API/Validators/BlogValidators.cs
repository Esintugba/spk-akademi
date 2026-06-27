using API.Dtos;
using API.Entities;
using FluentValidation;

namespace API.Validators;

public class BlogQueryValidator : AbstractValidator<BlogQueryDto>
{
    public BlogQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 48);
        RuleFor(x => x.Search).MaximumLength(120);
        RuleFor(x => x.CategorySlug).MaximumLength(220).Matches("^[a-zA-Z0-9-]*$").When(x => !string.IsNullOrWhiteSpace(x.CategorySlug));
        RuleFor(x => x.TagSlug).MaximumLength(220).Matches("^[a-zA-Z0-9-]*$").When(x => !string.IsNullOrWhiteSpace(x.TagSlug));
    }
}

public class UpsertBlogPostValidator : AbstractValidator<UpsertBlogPostDto>
{
    public UpsertBlogPostValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(220);
        RuleFor(x => x.Slug).MaximumLength(240).Matches("^[a-zA-Z0-9-]*$").When(x => !string.IsNullOrWhiteSpace(x.Slug));
        RuleFor(x => x.Summary).NotEmpty().MaximumLength(600);
        RuleFor(x => x.Content).NotEmpty().MinimumLength(80);
        RuleFor(x => x.CoverImageUrl).MaximumLength(700);
        RuleFor(x => x.MetaTitle).MaximumLength(220);
        RuleFor(x => x.MetaDescription).MaximumLength(320);
        RuleFor(x => x.CanonicalUrl).MaximumLength(700);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.PublishedAt)
            .NotNull()
            .When(x => x.Status == BlogPostStatus.Published)
            .WithMessage("PublishedAt yayınlanan yazılar için zorunludur.");
        RuleFor(x => x.Tags).Must(x => x is null || x.Count <= 12).WithMessage("En fazla 12 etiket kullanılabilir.");
    }
}

public class UpsertBlogCategoryValidator : AbstractValidator<UpsertBlogCategoryDto>
{
    public UpsertBlogCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(140);
        RuleFor(x => x.Slug).MaximumLength(160).Matches("^[a-zA-Z0-9-]*$").When(x => !string.IsNullOrWhiteSpace(x.Slug));
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.DisplayOrder).GreaterThanOrEqualTo(0);
    }
}
