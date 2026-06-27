using API.Configuration;
using API.Mapping;
using API.Repositories;
using API.Services;
using API.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.Options;
using System.Threading.Channels;

namespace API.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(_ => { }, typeof(QuizTrialMappingProfile).Assembly);

        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<StartLicensedQuizRequestValidator>();

        services.AddScoped<ITrialExamRepository, TrialExamRepository>();
        services.AddScoped<ILicenseCatalogRepository, LicenseCatalogRepository>();
        services.AddScoped<ISitemapRepository, SitemapRepository>();
        services.AddScoped<IBlogRepository, BlogRepository>();
        services.AddScoped<IQuizRepository, QuizRepository>();
        services.AddScoped<IQuizAttemptRepository, QuizAttemptRepository>();
        services.AddScoped<IQuestionRepository, QuestionRepository>();
        services.AddScoped<ISourceDocumentRepository, SourceDocumentRepository>();
        services.AddScoped<IConsentLogRepository, ConsentLogRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<ITopicRepository, TopicRepository>();
        services.AddScoped<IStudyNoteRepository, StudyNoteRepository>();
        services.AddScoped<IPublicContentRepository, PublicContentRepository>();
        services.AddScoped<ILicenseManagementRepository, LicenseManagementRepository>();
        services.AddScoped<IStudentLicenseRepository, StudentLicenseRepository>();
        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IQuizTrialService, QuizTrialService>();
        services.AddScoped<IQuizGenerationService, QuizGenerationService>();
        services.AddScoped<IStandardQuizStrategy, StandardQuizStrategy>();
        services.AddScoped<ICoursePracticeStrategy, CoursePracticeStrategy>();
        services.AddScoped<IPastExamStrategy, PastExamStrategy>();
        services.AddScoped<IWrongAnswersStrategy, WrongAnswersStrategy>();
        services.AddScoped<IQuizAttemptService, QuizAttemptService>();
        services.AddScoped<IQuestionService, QuestionService>();
        services.AddScoped<ISourceDocumentFileStorage, SourceDocumentFileStorage>();
        services.AddScoped<ISourceDocumentService, SourceDocumentService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IConsentService, ConsentService>();
        services.AddScoped<IConsentAdminService, ConsentAdminService>();
        services.AddScoped<ICourseManagementService, CourseManagementService>();
        services.AddScoped<ITopicManagementService, TopicManagementService>();
        services.AddScoped<IStudyNoteManagementService, StudyNoteManagementService>();
        services.AddScoped<IPublicContentService, PublicContentService>();
        services.AddScoped<ILicenseManagementService, LicenseManagementService>();
        services.AddScoped<ITrialExamManagementService, TrialExamManagementService>();
        services.AddScoped<IQuizCatalogService, QuizCatalogService>();
        services.AddScoped<IQuizRecommendationService, QuizRecommendationService>();
        services.AddScoped<ILicenseCatalogService, LicenseCatalogService>();
        services.AddScoped<ILicenseCatalogCache>(sp => sp.GetRequiredService<ILicenseCatalogService>());
        services.AddScoped<IPlanCatalogService, PlanCatalogService>();
        services.AddScoped<IPlanCatalogCache>(sp => sp.GetRequiredService<IPlanCatalogService>());
        services.AddScoped<ISitemapService, SitemapService>();
        services.AddScoped<ISeoCache>(sp => sp.GetRequiredService<ISitemapService>());
        services.AddScoped<IRobotsService, RobotsService>();
        services.AddScoped<IBlogService, BlogService>();
        services.AddScoped<IWrongAnswerQueueRepository, WrongAnswerQueueRepository>();
        services.AddScoped<IWrongAnswerReviewHistoryRepository, WrongAnswerReviewHistoryRepository>();
        services.AddScoped<ISpacedRepetitionService, SpacedRepetitionService>();
        services.AddScoped<IWrongAnswerService, WrongAnswerService>();
        services.AddScoped<IQuizResultRepository, QuizResultRepository>();
        services.AddScoped<IQuizResultService, QuizResultService>();
        services.AddScoped<ICoursePracticeRepository, CoursePracticeRepository>();
        services.AddScoped<ICoursePracticeService, CoursePracticeService>();
        services.AddScoped<IMaterialRepository, MaterialRepository>();
        services.AddScoped<IMaterialProgressRepository, MaterialProgressRepository>();
        services.AddScoped<IMaterialBookmarkRepository, MaterialBookmarkRepository>();
        services.AddScoped<IMaterialNoteRepository, MaterialNoteRepository>();
        services.AddScoped<IPdfViewerService, PdfViewerService>();
        services.AddScoped<IMaterialProgressService, MaterialProgressService>();
        services.AddScoped<IMaterialNotesService, MaterialNotesService>();
        services.AddScoped<IMaterialBookmarksService, MaterialBookmarksService>();
        services.AddScoped<IPastExamRepository, PastExamRepository>();
        services.AddScoped<IPastExamService, PastExamService>();
        services.AddScoped<IPastExamQuizService, PastExamQuizService>();
        services.AddScoped<IExamAnalyticsService, ExamAnalyticsService>();
        services.AddScoped<IQuestionStudyProgressRepository, QuestionStudyProgressRepository>();
        services.AddScoped<IReviewSessionRepository, ReviewSessionRepository>();
        services.AddScoped<ISm2AlgorithmService, Sm2AlgorithmService>();
        services.AddScoped<IReviewSessionService, ReviewSessionService>();
        services.AddScoped<IQuizRoutingService, QuizRoutingService>();
        services.AddScoped<IQuizSessionResolverService, QuizSessionResolverService>();
        services.AddScoped<IAccessRequestRepository, AccessRequestRepository>();
        services.AddScoped<IUserLicenseAccessRepository, UserLicenseAccessRepository>();
        services.AddScoped<IUserLicenseAccessManagementService, UserLicenseAccessManagementService>();
        services.AddScoped<IAccessApprovalService, AccessApprovalService>();
        services.AddScoped<IAccessRequestService, AccessRequestService>();
        services.AddScoped<IEmailNotificationService, EmailNotificationService>();
        services.AddScoped<IUserOnboardingRepository, UserOnboardingRepository>();
        services.AddScoped<IDemoAccessService, DemoAccessService>();
        services.AddScoped<IOnboardingService, OnboardingService>();
        services.AddScoped<IUserSettingsService, UserSettingsService>();
        services.AddScoped<IAdaptiveStudyPlanService, AdaptiveStudyPlanService>();
        services.AddScoped<IUserGamificationRepository, UserGamificationRepository>();
        services.AddScoped<IBadgeRepository, BadgeRepository>();
        services.AddScoped<IDailyGoalRepository, DailyGoalRepository>();
        services.AddScoped<IUserGoalRepository, UserGoalRepository>();
        services.AddScoped<IXPTransactionRepository, XPTransactionRepository>();
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<IUserGoalService, UserGoalService>();
        services.AddScoped<IBadgeService, BadgeService>();
        services.AddScoped<IBadgeManagementService, BadgeManagementService>();
        services.AddScoped<IXPService, XPService>();
        services.AddScoped<IGamificationRewardService, GamificationRewardService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<IContactMessageRepository, ContactMessageRepository>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<ISupportTicketService, SupportTicketService>();
        services.AddScoped<IContactNotificationService, ContactNotificationService>();
        services.AddScoped<IContactCaptchaVerifier, ContactCaptchaVerifier>();
        services.AddScoped<IImportJobRepository, ImportJobRepository>();
        services.AddScoped<IDuplicateDetectionRepository, DuplicateDetectionRepository>();
        services.AddScoped<IImportFileParser, ImportFileParser>();
        services.AddScoped<IImportValidationService, ImportValidationService>();
        services.AddScoped<IDuplicateDetectionService, DuplicateDetectionService>();
        services.AddScoped<IQuestionImportService, QuestionImportService>();
        services.AddScoped<IAdminMaterialImportService, AdminMaterialImportService>();
        services.AddSingleton<BackgroundQueueMetrics>();
        services.AddSingleton(sp => CreateBoundedChannel<ContactEmailNotification>(
            sp,
            BackgroundQueueNames.Contact,
            options => options.ContactCapacity));
        services.AddSingleton(sp => CreateBoundedChannel<Guid>(
            sp,
            BackgroundQueueNames.Import,
            options => options.ImportCapacity));
        services.AddSingleton<ImportJobQueue>();
        services.AddSingleton<IImportJobQueue>(sp => sp.GetRequiredService<ImportJobQueue>());
        services.AddHostedService(sp => sp.GetRequiredService<ImportJobQueue>());
        services.AddSingleton<ContactNotificationQueue>();
        services.AddSingleton<IContactNotificationQueue>(sp => sp.GetRequiredService<ContactNotificationQueue>());
        services.AddHostedService(sp => sp.GetRequiredService<ContactNotificationQueue>());
        services.AddSingleton<ILeaderboardCache, LeaderboardCache>();

        return services;
    }

    private static Channel<T> CreateBoundedChannel<T>(
        IServiceProvider serviceProvider,
        string queueName,
        Func<BackgroundQueueOptions, int> capacitySelector)
    {
        var options = serviceProvider.GetRequiredService<IOptions<BackgroundQueueOptions>>().Value;
        var capacity = Math.Max(1, capacitySelector(options));
        var metrics = serviceProvider.GetRequiredService<BackgroundQueueMetrics>();
        metrics.Register(queueName, capacity);

        return Channel.CreateBounded<T>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });
    }
}
