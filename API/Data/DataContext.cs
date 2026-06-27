using API.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class DataContext(DbContextOptions<DataContext> options) : IdentityDbContext<AppUser>(options)
{
    public DbSet<License> Licenses => Set<License>();

    public DbSet<Plan> Plans => Set<Plan>();

    public DbSet<PlanLicense> PlanLicenses => Set<PlanLicense>();

    public DbSet<Course> Courses => Set<Course>();

    public DbSet<Topic> Topics => Set<Topic>();

    public DbSet<StudyNote> StudyNotes => Set<StudyNote>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();

    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();

    public DbSet<QuizAttemptQuestion> QuizAttemptQuestions => Set<QuizAttemptQuestion>();

    public DbSet<TrialExam> TrialExams => Set<TrialExam>();

    public DbSet<TrialExamQuestion> TrialExamQuestions => Set<TrialExamQuestion>();

    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();

    public DbSet<StudyProgress> StudyProgresses => Set<StudyProgress>();

    public DbSet<SourceDocument> SourceDocuments => Set<SourceDocument>();

    public DbSet<UserMaterialProgress> UserMaterialProgresses => Set<UserMaterialProgress>();

    public DbSet<MaterialBookmark> MaterialBookmarks => Set<MaterialBookmark>();

    public DbSet<MaterialNote> MaterialNotes => Set<MaterialNote>();

    public DbSet<UserLicenseAccess> UserLicenseAccesses => Set<UserLicenseAccess>();
    public DbSet<UserOnboardingState> UserOnboardingStates => Set<UserOnboardingState>();

    public DbSet<UserSettings> UserSettings => Set<UserSettings>();

    public DbSet<AccessRequest> AccessRequests => Set<AccessRequest>();

    public DbSet<TrialExamPurchase> TrialExamPurchases => Set<TrialExamPurchase>();

    public DbSet<WrongAnswerQueue> WrongAnswerQueues => Set<WrongAnswerQueue>();

    public DbSet<WrongAnswerReviewHistory> WrongAnswerReviewHistories => Set<WrongAnswerReviewHistory>();

    public DbSet<QuestionStudyProgress> QuestionStudyProgresses => Set<QuestionStudyProgress>();

    public DbSet<ReviewSession> ReviewSessions => Set<ReviewSession>();

    public DbSet<ReviewSessionAnswer> ReviewSessionAnswers => Set<ReviewSessionAnswer>();

    public DbSet<ModerationHistory> ModerationHistories => Set<ModerationHistory>();

    public DbSet<UserGamificationProfile> UserGamificationProfiles => Set<UserGamificationProfile>();

    public DbSet<Badge> Badges => Set<Badge>();

    public DbSet<UserBadge> UserBadges => Set<UserBadge>();

    public DbSet<DailyGoal> DailyGoals => Set<DailyGoal>();

    public DbSet<UserDailyGoal> UserDailyGoals => Set<UserDailyGoal>();

    public DbSet<UserGoal> UserGoals => Set<UserGoal>();

    public DbSet<UserTopicPreference> UserTopicPreferences => Set<UserTopicPreference>();

    public DbSet<XPTransaction> XPTransactions => Set<XPTransaction>();

    public DbSet<AdaptiveStudyPlan> AdaptiveStudyPlans => Set<AdaptiveStudyPlan>();

    public DbSet<AdaptiveStudyTask> AdaptiveStudyTasks => Set<AdaptiveStudyTask>();

    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

    public DbSet<SupportTicketMessage> SupportTicketMessages => Set<SupportTicketMessage>();

    public DbSet<SupportTicketStatusHistory> SupportTicketStatusHistories => Set<SupportTicketStatusHistory>();

    public DbSet<SupportTicketNotification> SupportTicketNotifications => Set<SupportTicketNotification>();

    public DbSet<ConsentLog> ConsentLogs => Set<ConsentLog>();

    public DbSet<ImportJob> ImportJobs => Set<ImportJob>();

    public DbSet<ImportError> ImportErrors => Set<ImportError>();

    public DbSet<DuplicateQuestionMatch> DuplicateQuestionMatches => Set<DuplicateQuestionMatch>();

    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();

    public DbSet<BlogCategory> BlogCategories => Set<BlogCategory>();

    public DbSet<BlogTag> BlogTags => Set<BlogTag>();

    public DbSet<BlogPostTag> BlogPostTags => Set<BlogPostTag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<License>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.ShortDescription).HasMaxLength(300);
            entity.Property(x => x.IconUrl).HasMaxLength(500);
            entity.HasIndex(x => new { x.IsActive, x.DisplayOrder });
            entity.HasIndex(x => new { x.IsFeatured, x.IsActive, x.DisplayOrder });
        });

        modelBuilder.Entity<Plan>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.ShortDescription).HasMaxLength(300);
            entity.HasIndex(x => new { x.IsActive, x.DisplayOrder });
            entity.HasIndex(x => new { x.IsFeatured, x.IsActive, x.DisplayOrder });
        });

        modelBuilder.Entity<PlanLicense>(entity =>
        {
            entity.HasIndex(x => new { x.PlanId, x.LicenseId }).IsUnique();
            entity.HasIndex(x => x.LicenseId);

            entity.HasOne(x => x.Plan)
                .WithMany(x => x.PlanLicenses)
                .HasForeignKey(x => x.PlanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.License)
                .WithMany()
                .HasForeignKey(x => x.LicenseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasIndex(x => new { x.LicenseId, x.Slug }).IsUnique();

            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);

            entity.HasOne(x => x.License)
                .WithMany(x => x.Courses)
                .HasForeignKey(x => x.LicenseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Topic>(entity =>
        {
            entity.HasIndex(x => new { x.CourseId, x.Slug }).IsUnique();
            entity.HasIndex(x => x.ParentTopicId);
            entity.HasIndex(x => new { x.CourseId, x.Type, x.Order });
            entity.HasIndex(x => new { x.ParentTopicId, x.Type, x.Order });

            entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(270).IsRequired();
            entity.Property(x => x.Type).HasConversion<int>();

            entity.HasOne(x => x.Course)
                .WithMany(x => x.Topics)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ParentTopic)
                .WithMany(x => x.SubTopics)
                .HasForeignKey(x => x.ParentTopicId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<StudyNote>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.SourceReference).HasMaxLength(500);
            entity.Property(x => x.ReviewComment).HasMaxLength(2000);
            entity.HasIndex(x => new { x.ReviewStatus, x.IsDeleted });

            entity.HasOne(x => x.Topic)
                .WithMany(x => x.StudyNotes)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.Property(x => x.Text).IsRequired();
            entity.Property(x => x.Explanation).IsRequired();
            entity.Property(x => x.SolutionNote).HasMaxLength(4000);
            entity.Property(x => x.SourceReference).HasMaxLength(500);
            entity.Property(x => x.ReviewComment).HasMaxLength(2000);
            entity.HasIndex(x => new { x.ReviewStatus, x.IsDeleted });
            entity.HasIndex(x => new { x.TopicId, x.ReviewStatus, x.Difficulty });
            entity.HasIndex(x => new { x.ReviewStatus, x.TopicId });
            entity.HasIndex(x => new { x.IsPastExamQuestion, x.ExamYear, x.ExamType });
            entity.Property(x => x.ExamType).HasConversion<int?>();
            entity.Property(x => x.ExamSession).HasConversion<int?>();

            entity.HasOne(x => x.Topic)
                .WithMany(x => x.Questions)
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<QuestionOption>(entity =>
        {
            entity.HasIndex(x => new { x.QuestionId, x.Label }).IsUnique();

            entity.Property(x => x.Label).HasMaxLength(5).IsRequired();
            entity.Property(x => x.Text).IsRequired();

            entity.HasOne(x => x.Question)
                .WithMany(x => x.Options)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuizAttempt>(entity =>
        {
            entity.Property(x => x.UserId).HasMaxLength(450);
            entity.Property(x => x.Status).HasConversion<int>();
            entity.Property(x => x.GeneratedFiltersJson).HasMaxLength(4000);
            entity.Property(x => x.PastExamFilterJson).HasMaxLength(4000);
            entity.HasIndex(x => new { x.UserId, x.Mode, x.GeneratedFromWrongAnswers });
            entity.HasIndex(x => new { x.UserId, x.CourseId, x.Mode });
            entity.HasIndex(x => new { x.UserId, x.Status, x.LastActivityAt });

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Course)
                .WithMany()
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Topic)
                .WithMany()
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.TrialExam)
                .WithMany()
                .HasForeignKey(x => x.TrialExamId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<QuizAttemptQuestion>(entity =>
        {
            entity.HasIndex(x => new { x.QuizAttemptId, x.QuestionId }).IsUnique();
            entity.HasIndex(x => new { x.QuizAttemptId, x.Order }).IsUnique();

            entity.HasOne(x => x.QuizAttempt)
                .WithMany(x => x.AttemptQuestions)
                .HasForeignKey(x => x.QuizAttemptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<QuizAnswer>(entity =>
        {
            entity.HasOne(x => x.QuizAttempt)
                .WithMany(x => x.Answers)
                .HasForeignKey(x => x.QuizAttemptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany(x => x.QuizAnswers)
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.SelectedOption)
                .WithMany()
                .HasForeignKey(x => x.SelectedOptionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StudyProgress>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.TopicId }).IsUnique();

            entity.Property(x => x.UserId).HasMaxLength(450);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Topic)
                .WithMany()
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SourceDocument>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
            entity.Property(x => x.FileName).HasMaxLength(260).IsRequired();
            entity.Property(x => x.FilePath).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.SourceName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.ReviewComment).HasMaxLength(2000);
            entity.HasIndex(x => new { x.ReviewStatus, x.IsDeleted });

            entity.HasOne(x => x.Course)
                .WithMany(x => x.SourceDocuments)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserMaterialProgress>(entity =>
        {
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.ProgressPercentage).HasPrecision(5, 1);
            entity.HasIndex(x => new { x.UserId, x.MaterialId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.LastOpenedAt });

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Material)
                .WithMany()
                .HasForeignKey(x => x.MaterialId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MaterialBookmark>(entity =>
        {
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.MaterialId, x.PageNumber }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.MaterialId });

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Material)
                .WithMany()
                .HasForeignKey(x => x.MaterialId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MaterialNote>(entity =>
        {
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(1500).IsRequired();
            entity.Property(x => x.SelectedText).HasMaxLength(1200);
            entity.Property(x => x.HighlightColor).HasConversion<int>();
            entity.Property(x => x.FolderName).HasMaxLength(80);
            entity.Property(x => x.Tags).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ReviewEaseFactor).HasPrecision(4, 2);
            entity.HasIndex(x => new { x.UserId, x.MaterialId, x.PageNumber });
            entity.HasIndex(x => new { x.UserId, x.MaterialId });
            entity.HasIndex(x => new { x.UserId, x.IsInReview, x.NextReviewAt });

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Material)
                .WithMany()
                .HasForeignKey(x => x.MaterialId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserTopicPreference>(entity =>
        {
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.TopicId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.IsFavorite });
            entity.HasIndex(x => new { x.UserId, x.IsInWeeklyPlan });

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Topic)
                .WithMany()
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TrialExam>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(280).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.ReviewComment).HasMaxLength(2000);
            entity.Property(x => x.Tags).HasMaxLength(1000);
            entity.Property(x => x.DifficultyLevel).HasConversion<int>();
            entity.Property(x => x.PopularityScore).HasPrecision(9, 2);
            entity.HasIndex(x => new { x.ReviewStatus, x.IsDeleted });
            entity.HasIndex(x => new { x.LicenseId, x.IsPublished, x.DifficultyLevel });
            entity.HasIndex(x => new { x.IsFeatured, x.IsPublished, x.PopularityScore });
            entity.HasIndex(x => new { x.IsPublished, x.IsDeleted, x.CreatedAt });

            entity.HasOne(x => x.License)
                .WithMany()
                .HasForeignKey(x => x.LicenseId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TrialExamQuestion>(entity =>
        {
            entity.HasKey(x => new { x.TrialExamId, x.QuestionId });
            entity.HasIndex(x => new { x.TrialExamId, x.Order }).IsUnique();

            entity.HasOne(x => x.TrialExam)
                .WithMany(x => x.Questions)
                .HasForeignKey(x => x.TrialExamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<QuestionStudyProgress>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.QuestionId }).IsUnique();
            entity.HasIndex(x => new { x.StudentId, x.NextReviewAt, x.MasteryLevel });
            entity.HasIndex(x => new { x.StudentId, x.MasteryLevel });

            entity.Property(x => x.StudentId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.EaseFactor).HasPrecision(4, 2);
            entity.Property(x => x.CorrectRate).HasPrecision(5, 1);

            entity.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReviewSession>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.StartedAt });
            entity.HasIndex(x => new { x.StudentId, x.CompletedAt });

            entity.Property(x => x.StudentId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.AverageQuality).HasPrecision(4, 2);

            entity.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReviewSessionAnswer>(entity =>
        {
            entity.HasIndex(x => new { x.ReviewSessionId, x.QuestionId }).IsUnique();
            entity.HasIndex(x => new { x.QuestionId, x.ReviewedAt });

            entity.HasOne(x => x.ReviewSession)
                .WithMany(x => x.Answers)
                .HasForeignKey(x => x.ReviewSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WrongAnswerQueue>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.QuestionId }).IsUnique();
            entity.HasIndex(x => new { x.StudentId, x.NextReviewAt, x.IsMastered });
            entity.HasIndex(x => new { x.StudentId, x.LastWrongAt });

            entity.Property(x => x.StudentId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WrongAnswerReviewHistory>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.ReviewedAt });
            entity.HasIndex(x => new { x.StudentId, x.QuestionId, x.ReviewedAt });
            entity.HasIndex(x => x.QuizAttemptId);

            entity.Property(x => x.StudentId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.QuizAttempt)
                .WithMany()
                .HasForeignKey(x => x.QuizAttemptId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TrialExamPurchase>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.TrialExamId }).IsUnique();

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.TrialExam)
                .WithMany()
                .HasForeignKey(x => x.TrialExamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserOnboardingState>(entity =>
        {
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Theme).HasConversion<int>();
            entity.Property(x => x.Language).HasConversion<int>();
            entity.Property(x => x.DateFormat).HasConversion<int>();
            entity.Property(x => x.TimeFormat).HasConversion<int>();
            entity.Property(x => x.DefaultQuizMode).HasConversion<int>();
            entity.Property(x => x.QuestionTransition).HasConversion<int>();
            entity.Property(x => x.PreferredPdfView).HasConversion<int>();
            entity.Property(x => x.PreferredStudyDays).HasMaxLength(32);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserLicenseAccess>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.LicenseId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.IsDemoAccess, x.IsActive });
            entity.HasIndex(x => x.ExpiresAt);

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.License)
                .WithMany()
                .HasForeignKey(x => x.LicenseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AccessRequest>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.PlanId, x.Status });
            entity.HasIndex(x => new { x.Status, x.RequestedAt });
            entity.HasIndex(x => x.RequestedAt);

            entity.Property(x => x.StudentId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(2000);
            entity.Property(x => x.AdminNote).HasMaxLength(2000);
            entity.Property(x => x.ReviewedByUserId).HasMaxLength(450);

            entity.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Plan)
                .WithMany()
                .HasForeignKey(x => x.PlanId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ReviewedBy)
                .WithMany()
                .HasForeignKey(x => x.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ModerationHistory>(entity =>
        {
            entity.Property(x => x.ContentType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Comment).HasMaxLength(2000);
            entity.HasIndex(x => new { x.ContentType, x.ContentId, x.CreatedAt });

            entity.HasOne(x => x.Reviewer)
                .WithMany()
                .HasForeignKey(x => x.ReviewerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserGamificationProfile>(entity =>
        {
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasIndex(x => new { x.TotalXP, x.Level });
            entity.HasIndex(x => x.CurrentStreak);

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Badge>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();

            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.Property(x => x.IconUrl).HasMaxLength(500).IsRequired();
        });

        modelBuilder.Entity<UserBadge>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.BadgeId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.UnlockedAt });

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Badge)
                .WithMany(x => x.UserBadges)
                .HasForeignKey(x => x.BadgeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DailyGoal>(entity =>
        {
            entity.HasIndex(x => new { x.ActiveDate, x.GoalType, x.TargetValue }).IsUnique();

            entity.Property(x => x.Title).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(300).IsRequired();
        });

        modelBuilder.Entity<UserDailyGoal>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.DailyGoalId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.Completed, x.CompletedAt });

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.DailyGoal)
                .WithMany(x => x.UserGoals)
                .HasForeignKey(x => x.DailyGoalId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserGoal>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.Status, x.TargetDate });
            entity.HasIndex(x => new { x.UserId, x.GoalType });

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.GoalType).HasConversion<int>();
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<XPTransaction>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.CreatedAt });
            entity.HasIndex(x => new { x.UserId, x.ReferenceType, x.ReferenceId });

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Reason).HasMaxLength(120).IsRequired();
            entity.Property(x => x.ReferenceType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.ReferenceId).HasMaxLength(160);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AdaptiveStudyPlan>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.PlanDate }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.GeneratedAt });

            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.CompletionRate).HasPrecision(5, 1);
            entity.Property(x => x.EstimatedTargetCompletionRate).HasPrecision(5, 1);
            entity.Property(x => x.Summary).HasMaxLength(600);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AdaptiveStudyTask>(entity =>
        {
            entity.HasIndex(x => new { x.PlanId, x.Priority });
            entity.HasIndex(x => x.TopicId);
            entity.HasIndex(x => new { x.Completed, x.CompletedAt });

            entity.Property(x => x.Type).HasConversion<int>();
            entity.Property(x => x.Priority).HasPrecision(7, 2);
            entity.Property(x => x.ActionUrl).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(600).IsRequired();

            entity.HasOne(x => x.Plan)
                .WithMany(x => x.Tasks)
                .HasForeignKey(x => x.PlanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Topic)
                .WithMany()
                .HasForeignKey(x => x.TopicId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.HasIndex(x => new { x.Status, x.CreatedAt });
            entity.HasIndex(x => new { x.Email, x.CreatedAt });
            entity.HasIndex(x => new { x.IpAddress, x.CreatedAt });
            entity.HasIndex(x => x.ReadAt);

            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(254).IsRequired();
            entity.Property(x => x.Subject).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Status).HasConversion<int>();
            entity.Property(x => x.IpAddress).HasMaxLength(64);
            entity.Property(x => x.UserAgent).HasMaxLength(512);
            entity.Property(x => x.AssignedToUserId).HasMaxLength(450);
            entity.Property(x => x.AdminNote).HasMaxLength(2000);

            entity.HasOne(x => x.AssignedToUser)
                .WithMany()
                .HasForeignKey(x => x.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SupportTicket>(entity =>
        {
            entity.HasIndex(x => x.TicketNumber).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.Status, x.UpdatedAt });
            entity.HasIndex(x => new { x.Status, x.Priority, x.CreatedAt });
            entity.HasIndex(x => x.AssignedAdminId);

            entity.Property(x => x.TicketNumber).HasMaxLength(32).IsRequired();
            entity.Property(x => x.UserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.AssignedAdminId).HasMaxLength(450);
            entity.Property(x => x.Subject).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Category).HasConversion<int>();
            entity.Property(x => x.Priority).HasConversion<int>();
            entity.Property(x => x.Status).HasConversion<int>();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.AssignedAdmin)
                .WithMany()
                .HasForeignKey(x => x.AssignedAdminId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SupportTicketMessage>(entity =>
        {
            entity.HasIndex(x => new { x.TicketId, x.CreatedAt });
            entity.HasIndex(x => x.SenderId);

            entity.Property(x => x.SenderId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.AttachmentUrl).HasMaxLength(1000);

            entity.HasOne(x => x.Ticket)
                .WithMany(x => x.Messages)
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Sender)
                .WithMany()
                .HasForeignKey(x => x.SenderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupportTicketStatusHistory>(entity =>
        {
            entity.HasIndex(x => new { x.TicketId, x.CreatedAt });

            entity.Property(x => x.ChangedById).HasMaxLength(450);
            entity.Property(x => x.OldStatus).HasConversion<int?>();
            entity.Property(x => x.NewStatus).HasConversion<int>();
            entity.Property(x => x.Note).HasMaxLength(1000);

            entity.HasOne(x => x.Ticket)
                .WithMany(x => x.StatusHistory)
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ChangedBy)
                .WithMany()
                .HasForeignKey(x => x.ChangedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SupportTicketNotification>(entity =>
        {
            entity.HasIndex(x => new { x.RecipientUserId, x.IsRead, x.CreatedAt });
            entity.HasIndex(x => new { x.TicketId, x.Type });

            entity.Property(x => x.RecipientUserId).HasMaxLength(450);
            entity.Property(x => x.Type).HasConversion<int>();
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(500).IsRequired();

            entity.HasOne(x => x.Ticket)
                .WithMany()
                .HasForeignKey(x => x.TicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.RecipientUser)
                .WithMany()
                .HasForeignKey(x => x.RecipientUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ConsentLog>(entity =>
        {
            entity.Property(x => x.UserId).HasMaxLength(450);
            entity.Property(x => x.ConsentType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Version).HasMaxLength(40).IsRequired();
            entity.Property(x => x.IpAddress).HasMaxLength(64);
            entity.Property(x => x.UserAgent).HasMaxLength(512);
            entity.HasIndex(x => new { x.ConsentType, x.CreatedAt });
            entity.HasIndex(x => x.UserId);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ImportJob>(entity =>
        {
            entity.HasIndex(x => new { x.ImportType, x.Status, x.CreatedAt });
            entity.HasIndex(x => x.CreatedByUserId);

            entity.Property(x => x.FileName).HasMaxLength(260).IsRequired();
            entity.Property(x => x.ImportType).HasConversion<int>();
            entity.Property(x => x.Status).HasConversion<int>();
            entity.Property(x => x.CreatedByUserId).HasMaxLength(450).IsRequired();
            entity.Property(x => x.ErrorReportUrl).HasMaxLength(1000);
            entity.Property(x => x.StoredFilePath).HasMaxLength(1000);
            entity.Property(x => x.Summary).HasMaxLength(4000);

            entity.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImportError>(entity =>
        {
            entity.HasIndex(x => new { x.ImportJobId, x.RowNumber });

            entity.Property(x => x.ColumnName).HasMaxLength(120);
            entity.Property(x => x.ErrorMessage).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.RawData).HasMaxLength(4000);

            entity.HasOne(x => x.ImportJob)
                .WithMany(x => x.Errors)
                .HasForeignKey(x => x.ImportJobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DuplicateQuestionMatch>(entity =>
        {
            entity.HasIndex(x => new { x.QuestionId, x.MatchedQuestionId }).IsUnique();
            entity.HasIndex(x => new { x.MatchType, x.SimilarityScore });

            entity.Property(x => x.SimilarityScore).HasPrecision(5, 3);
            entity.Property(x => x.MatchType).HasConversion<int>();

            entity.HasOne(x => x.Question)
                .WithMany()
                .HasForeignKey(x => x.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.MatchedQuestion)
                .WithMany()
                .HasForeignKey(x => x.MatchedQuestionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BlogCategory>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasIndex(x => x.DisplayOrder);
            entity.Property(x => x.Name).HasMaxLength(140).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<BlogTag>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(140).IsRequired();
        });

        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasIndex(x => new { x.Status, x.PublishedAt, x.IsDeleted });
            entity.HasIndex(x => new { x.CategoryId, x.Status, x.PublishedAt });
            entity.HasIndex(x => x.ViewCount);

            entity.Property(x => x.Title).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(240).IsRequired();
            entity.Property(x => x.Summary).HasMaxLength(600).IsRequired();
            entity.Property(x => x.Content).IsRequired();
            entity.Property(x => x.CoverImageUrl).HasMaxLength(700);
            entity.Property(x => x.AuthorId).HasMaxLength(450);
            entity.Property(x => x.Status).HasConversion<int>();
            entity.Property(x => x.MetaTitle).HasMaxLength(220);
            entity.Property(x => x.MetaDescription).HasMaxLength(320);
            entity.Property(x => x.CanonicalUrl).HasMaxLength(700);

            entity.HasOne(x => x.Author)
                .WithMany()
                .HasForeignKey(x => x.AuthorId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Posts)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<BlogPostTag>(entity =>
        {
            entity.HasKey(x => new { x.BlogPostId, x.TagId });
            entity.HasOne(x => x.BlogPost)
                .WithMany(x => x.PostTags)
                .HasForeignKey(x => x.BlogPostId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Tag)
                .WithMany(x => x.PostTags)
                .HasForeignKey(x => x.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
