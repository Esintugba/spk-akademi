using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSettingsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    Theme = table.Column<int>(type: "INTEGER", nullable: false),
                    Language = table.Column<int>(type: "INTEGER", nullable: false),
                    DateFormat = table.Column<int>(type: "INTEGER", nullable: false),
                    TimeFormat = table.Column<int>(type: "INTEGER", nullable: false),
                    CompactView = table.Column<bool>(type: "INTEGER", nullable: false),
                    EmailNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    PushNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    NewContentNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    TrialReminders = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReviewReminder = table.Column<bool>(type: "INTEGER", nullable: false),
                    DailyGoalReminder = table.Column<bool>(type: "INTEGER", nullable: false),
                    WeeklyGoalReminder = table.Column<bool>(type: "INTEGER", nullable: false),
                    StudyReminders = table.Column<bool>(type: "INTEGER", nullable: false),
                    SupportTicketUpdates = table.Column<bool>(type: "INTEGER", nullable: false),
                    DailyGoalQuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                    DailyStudyMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    DefaultQuizMode = table.Column<int>(type: "INTEGER", nullable: false),
                    DefaultQuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AutoReviewSuggestions = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimedQuizDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    DefaultQuizDurationMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    AutoOpenExplanations = table.Column<bool>(type: "INTEGER", nullable: false),
                    QuestionTransition = table.Column<int>(type: "INTEGER", nullable: false),
                    AutoAddWrongAnswersToReview = table.Column<bool>(type: "INTEGER", nullable: false),
                    PreferredPdfView = table.Column<int>(type: "INTEGER", nullable: false),
                    RememberLastPdfPage = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutoSaveNotes = table.Column<bool>(type: "INTEGER", nullable: false),
                    ShowHighlights = table.Column<bool>(type: "INTEGER", nullable: false),
                    SecurityNotifications = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSettings_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSettings_UserId",
                table: "UserSettings",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSettings");
        }
    }
}
