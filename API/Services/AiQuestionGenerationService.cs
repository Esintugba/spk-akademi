using API.Configuration;
using API.Data;
using API.Dtos;
using API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace API.Services;

public interface IAiQuestionGenerationService
{
    Task<AiQuestionGenerationJobDto> CreateJobAsync(
        CreateAiQuestionGenerationJobDto dto,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<AiQuestionGenerationJobDto?> GetJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiQuestionGenerationJobDto>> GetJobsAsync(
        int take = 20,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiQuestionDraftDto>> GetDraftsAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task<AiQuestionDraftDto?> UpdateDraftAsync(
        Guid draftId,
        UpdateAiQuestionDraftDto dto,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task<int> PublishDraftsAsync(
        Guid jobId,
        PublishAiQuestionDraftsDto dto,
        string adminUserId,
        CancellationToken cancellationToken = default);

    Task ProcessJobAsync(Guid jobId, CancellationToken cancellationToken = default);
}

public class AiQuestionGenerationService(
    DataContext context,
    IPdfSourcePageService pageService,
    IAiQuestionProvider provider,
    IAiQuestionGenerationJobQueue queue,
    IOptions<AiQuestionGenerationOptions> options,
    ILicenseCatalogCache licenseCatalogCache,
    ILogger<AiQuestionGenerationService> logger) : IAiQuestionGenerationService
{
    public async Task<AiQuestionGenerationJobDto> CreateJobAsync(
        CreateAiQuestionGenerationJobDto dto,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.Enabled)
        {
            throw new InvalidOperationException("Yapay zekâ soru üretimi sunucuda etkin değil.");
        }

        var totalQuestions = dto.EasyQuestionCount + dto.MediumQuestionCount + dto.HardQuestionCount;
        if (totalQuestions > settings.MaxQuestionsPerJob)
        {
            throw new InvalidOperationException(
                $"Bir işte en fazla {settings.MaxQuestionsPerJob} soru üretilebilir.");
        }

        var sourceDocument = await context.SourceDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(
                document => document.Id == dto.SourceDocumentId && !document.IsDeleted,
                cancellationToken)
            ?? throw new InvalidOperationException("Kaynak PDF bulunamadı.");

        var topic = await context.Topics
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == dto.TopicId, cancellationToken)
            ?? throw new InvalidOperationException("Konu bulunamadı.");

        if (topic.CourseId != sourceDocument.CourseId)
        {
            throw new InvalidOperationException("Seçilen konu, kaynak PDF ile aynı derse ait olmalıdır.");
        }

        if (dto.EndPage > sourceDocument.PageCount)
        {
            throw new InvalidOperationException(
                $"Kaynak PDF toplam {sourceDocument.PageCount} sayfadır.");
        }

        pageService.SelectPageRange(
            sourceDocument.ExtractedText
                ?? throw new InvalidOperationException("Kaynak PDF metni henüz çıkarılmamış."),
            dto.StartPage,
            dto.EndPage);

        var job = new AiQuestionGenerationJob
        {
            SourceDocumentId = dto.SourceDocumentId,
            TopicId = dto.TopicId,
            RequestedByUserId = adminUserId,
            StartPage = dto.StartPage,
            EndPage = dto.EndPage,
            EasyQuestionCount = dto.EasyQuestionCount,
            MediumQuestionCount = dto.MediumQuestionCount,
            HardQuestionCount = dto.HardQuestionCount,
            IncludeExplanations = dto.IncludeExplanations,
            Model = settings.Model.Trim(),
            Status = AiQuestionGenerationJobStatus.Pending
        };

        context.AiQuestionGenerationJobs.Add(job);
        await context.SaveChangesAsync(cancellationToken);
        await queue.EnqueueAsync(job.Id, cancellationToken);

        return ToJobDto(job, sourceDocument.Title, topic.Title);
    }

    public async Task<AiQuestionGenerationJobDto?> GetJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var job = await context.AiQuestionGenerationJobs
            .AsNoTracking()
            .Include(item => item.SourceDocument)
            .Include(item => item.Topic)
            .FirstOrDefaultAsync(item => item.Id == jobId, cancellationToken);

        return job is null ? null : ToJobDto(job);
    }

    public async Task<IReadOnlyList<AiQuestionGenerationJobDto>> GetJobsAsync(
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        var jobs = await context.AiQuestionGenerationJobs
            .AsNoTracking()
            .Include(item => item.SourceDocument)
            .Include(item => item.Topic)
            .OrderByDescending(item => item.CreatedAt)
            .Take(Math.Clamp(take, 1, 100))
            .ToListAsync(cancellationToken);

        return jobs.Select(job => ToJobDto(job)).ToList();
    }

    public async Task<IReadOnlyList<AiQuestionDraftDto>> GetDraftsAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var drafts = await context.AiQuestionDrafts
            .AsNoTracking()
            .Where(draft => draft.JobId == jobId)
            .OrderBy(draft => draft.SourcePage)
            .ThenBy(draft => draft.CreatedAt)
            .ToListAsync(cancellationToken);

        return drafts.Select(ToDraftDto).ToList();
    }

    public async Task<AiQuestionDraftDto?> UpdateDraftAsync(
        Guid draftId,
        UpdateAiQuestionDraftDto dto,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        var draft = await context.AiQuestionDrafts
            .Include(item => item.Job)
            .ThenInclude(job => job!.SourceDocument)
            .FirstOrDefaultAsync(item => item.Id == draftId, cancellationToken);

        if (draft is null)
        {
            return null;
        }

        if (draft.Status == AiQuestionDraftStatus.Published)
        {
            throw new InvalidOperationException("Soru havuzuna aktarılmış taslak değiştirilemez.");
        }

        if (draft.Job is null ||
            dto.SourcePage < draft.Job.StartPage ||
            dto.SourcePage > draft.Job.EndPage)
        {
            throw new InvalidOperationException("Kaynak sayfa seçilen üretim aralığının dışında.");
        }

        var sourceText = draft.Job.SourceDocument?.ExtractedText ?? string.Empty;
        if (!ContainsNormalized(sourceText, dto.SourceExcerpt))
        {
            throw new InvalidOperationException("Kaynak alıntı PDF metninde doğrulanamadı.");
        }

        draft.QuestionText = dto.QuestionText.Trim();
        draft.OptionA = dto.OptionA.Trim();
        draft.OptionB = dto.OptionB.Trim();
        draft.OptionC = dto.OptionC.Trim();
        draft.OptionD = dto.OptionD.Trim();
        draft.OptionE = string.IsNullOrWhiteSpace(dto.OptionE) ? null : dto.OptionE.Trim();
        draft.CorrectOption = dto.CorrectOption.Trim().ToUpperInvariant();
        draft.Explanation = dto.Explanation.Trim();
        draft.Difficulty = dto.Difficulty;
        draft.SourcePage = dto.SourcePage;
        draft.SourceExcerpt = dto.SourceExcerpt.Trim();
        draft.ReviewedByUserId = adminUserId;
        draft.ReviewedAt = DateTime.UtcNow;
        draft.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return ToDraftDto(draft);
    }

    public async Task<int> PublishDraftsAsync(
        Guid jobId,
        PublishAiQuestionDraftsDto dto,
        string adminUserId,
        CancellationToken cancellationToken = default)
    {
        var requestedIds = dto.DraftIds.Distinct().ToList();
        var drafts = await context.AiQuestionDrafts
            .Include(draft => draft.Job)
            .ThenInclude(job => job!.SourceDocument)
            .Where(draft => draft.JobId == jobId && requestedIds.Contains(draft.Id))
            .ToListAsync(cancellationToken);

        if (drafts.Count != requestedIds.Count)
        {
            throw new InvalidOperationException("Seçilen taslakların bir kısmı bulunamadı.");
        }

        if (drafts.Any(draft => draft.Status == AiQuestionDraftStatus.Published))
        {
            throw new InvalidOperationException("Seçilen taslaklardan biri daha önce soru havuzuna aktarılmış.");
        }

        var questionTexts = drafts.Select(draft => draft.QuestionText.Trim()).ToList();
        if (questionTexts.Distinct(StringComparer.OrdinalIgnoreCase).Count() != questionTexts.Count)
        {
            throw new InvalidOperationException("Seçilen taslaklar arasında aynı soru birden fazla kez bulunuyor.");
        }

        var existingQuestionTexts = await context.Questions
            .AsNoTracking()
            .Where(question => questionTexts.Contains(question.Text))
            .Select(question => question.Text)
            .ToListAsync(cancellationToken);
        if (existingQuestionTexts.Count > 0)
        {
            throw new InvalidOperationException(
                $"Soru havuzunda aynı metne sahip soru zaten var: {existingQuestionTexts[0]}");
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        foreach (var draft in drafts)
        {
            var sourceDocument = draft.Job?.SourceDocument
                ?? throw new InvalidOperationException("Taslağın kaynak PDF kaydı bulunamadı.");
            if (!ContainsNormalized(sourceDocument.ExtractedText ?? string.Empty, draft.SourceExcerpt))
            {
                throw new InvalidOperationException("Taslaklardan birinin kaynak alıntısı artık doğrulanamıyor.");
            }

            var question = new Question
            {
                TopicId = draft.Job!.TopicId,
                Text = draft.QuestionText.Trim(),
                Difficulty = draft.Difficulty,
                Type = QuestionType.Concept,
                Explanation = draft.Explanation.Trim(),
                SourceReference = $"{sourceDocument.Title}, sayfa {draft.SourcePage}",
                SourceText = draft.SourceExcerpt.Trim(),
                IsAiGenerated = true,
                ReviewStatus = ReviewStatus.PendingReview,
                AccessLevel = ContentAccessLevel.Premium,
                Options = BuildOptions(draft)
            };

            context.Questions.Add(question);
            draft.PublishedQuestion = question;
            draft.Status = AiQuestionDraftStatus.Published;
            draft.ReviewedByUserId = adminUserId;
            draft.ReviewedAt = DateTime.UtcNow;
            draft.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        licenseCatalogCache.Invalidate();
        return drafts.Count;
    }

    public async Task ProcessJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await context.AiQuestionGenerationJobs
            .Include(item => item.SourceDocument)
            .Include(item => item.Topic)
            .FirstOrDefaultAsync(item => item.Id == jobId, cancellationToken);
        if (job is null || job.Status != AiQuestionGenerationJobStatus.Pending)
        {
            return;
        }

        job.Status = AiQuestionGenerationJobStatus.Processing;
        job.StartedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        try
        {
            var sourceDocument = job.SourceDocument
                ?? throw new InvalidOperationException("Kaynak PDF bulunamadı.");
            var topic = job.Topic
                ?? throw new InvalidOperationException("Konu bulunamadı.");
            var sourceText = pageService.SelectPageRange(
                sourceDocument.ExtractedText
                    ?? throw new InvalidOperationException("Kaynak PDF metni bulunamadı."),
                job.StartPage,
                job.EndPage);

            var result = await provider.GenerateAsync(
                new AiQuestionGenerationInput(
                    sourceDocument.Title,
                    topic.Title,
                    job.StartPage,
                    job.EndPage,
                    job.EasyQuestionCount,
                    job.MediumQuestionCount,
                    job.HardQuestionCount,
                    job.IncludeExplanations,
                    sourceText),
                cancellationToken);

            ValidateDistribution(job, result.Questions);
            foreach (var question in result.Questions)
            {
                job.Drafts.Add(new AiQuestionDraft
                {
                    QuestionText = question.QuestionText,
                    OptionA = question.OptionA,
                    OptionB = question.OptionB,
                    OptionC = question.OptionC,
                    OptionD = question.OptionD,
                    OptionE = question.OptionE,
                    CorrectOption = question.CorrectOption,
                    Explanation = question.Explanation,
                    Difficulty = question.Difficulty,
                    SourcePage = question.SourcePage,
                    SourceExcerpt = question.SourceExcerpt,
                    Status = AiQuestionDraftStatus.PendingReview
                });
            }

            job.GeneratedQuestionCount = result.Questions.Count;
            job.InputTokens = result.InputTokens;
            job.OutputTokens = result.OutputTokens;
            job.Status = AiQuestionGenerationJobStatus.Completed;
            job.CompletedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "AI question generation job {JobId} failed.", jobId);
            job.Status = AiQuestionGenerationJobStatus.Failed;
            job.ErrorMessage = exception.Message[..Math.Min(exception.Message.Length, 4000)];
            job.CompletedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(CancellationToken.None);
        }
    }

    private static void ValidateDistribution(
        AiQuestionGenerationJob job,
        IReadOnlyList<GeneratedAiQuestion> questions)
    {
        var expectedTotal = job.EasyQuestionCount + job.MediumQuestionCount + job.HardQuestionCount;
        if (questions.Count != expectedTotal ||
            questions.Count(question => question.Difficulty == QuestionDifficulty.Easy) != job.EasyQuestionCount ||
            questions.Count(question => question.Difficulty == QuestionDifficulty.Medium) != job.MediumQuestionCount ||
            questions.Count(question => question.Difficulty == QuestionDifficulty.Hard) != job.HardQuestionCount)
        {
            throw new InvalidOperationException("Yapay zekâ istenen soru sayısı ve zorluk dağılımını sağlayamadı.");
        }
    }

    private static bool ContainsNormalized(string source, string excerpt)
    {
        static string Normalize(string value) =>
            string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

        return Normalize(source).Contains(Normalize(excerpt), StringComparison.Ordinal);
    }

    private static List<QuestionOption> BuildOptions(AiQuestionDraft draft)
    {
        var correct = draft.CorrectOption.Trim().ToUpperInvariant();
        return new[]
            {
                ("A", draft.OptionA),
                ("B", draft.OptionB),
                ("C", draft.OptionC),
                ("D", draft.OptionD),
                ("E", draft.OptionE)
            }
            .Where(option => !string.IsNullOrWhiteSpace(option.Item2))
            .Select(option => new QuestionOption
            {
                Label = option.Item1,
                Text = option.Item2!.Trim(),
                IsCorrect = option.Item1 == correct
            })
            .ToList();
    }

    private static AiQuestionGenerationJobDto ToJobDto(
        AiQuestionGenerationJob job,
        string? sourceDocumentTitle = null,
        string? topicTitle = null) =>
        new(
            job.Id,
            job.SourceDocumentId,
            sourceDocumentTitle ?? job.SourceDocument?.Title ?? string.Empty,
            job.TopicId,
            topicTitle ?? job.Topic?.Title ?? string.Empty,
            job.StartPage,
            job.EndPage,
            job.EasyQuestionCount,
            job.MediumQuestionCount,
            job.HardQuestionCount,
            job.IncludeExplanations,
            job.Model,
            job.Status,
            job.GeneratedQuestionCount,
            job.InputTokens,
            job.OutputTokens,
            job.ErrorMessage,
            job.CreatedAt,
            job.StartedAt,
            job.CompletedAt);

    private static AiQuestionDraftDto ToDraftDto(AiQuestionDraft draft) =>
        new(
            draft.Id,
            draft.JobId,
            draft.QuestionText,
            draft.OptionA,
            draft.OptionB,
            draft.OptionC,
            draft.OptionD,
            draft.OptionE,
            draft.CorrectOption,
            draft.Explanation,
            draft.Difficulty,
            draft.SourcePage,
            draft.SourceExcerpt,
            draft.Status,
            draft.PublishedQuestionId);
}
