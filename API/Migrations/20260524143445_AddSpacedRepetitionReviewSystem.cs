using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddSpacedRepetitionReviewSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuestionStudyProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StudentId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Repetition = table.Column<int>(type: "INTEGER", nullable: false),
                    EaseFactor = table.Column<decimal>(type: "TEXT", precision: 4, scale: 2, nullable: false),
                    IntervalDays = table.Column<int>(type: "INTEGER", nullable: false),
                    NextReviewAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ConsecutiveCorrectCount = table.Column<int>(type: "INTEGER", nullable: false),
                    MasteryLevel = table.Column<int>(type: "INTEGER", nullable: false),
                    CorrectRate = table.Column<decimal>(type: "TEXT", precision: 5, scale: 1, nullable: false),
                    AverageResponseTimeSeconds = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalReviews = table.Column<int>(type: "INTEGER", nullable: false),
                    CorrectReviews = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionStudyProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionStudyProgresses_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionStudyProgresses_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReviewSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StudentId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    QuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CorrectCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AverageQuality = table.Column<decimal>(type: "TEXT", precision: 4, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewSessions_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReviewSessionAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReviewSessionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Quality = table.Column<int>(type: "INTEGER", nullable: false),
                    AnsweredCorrect = table.Column<bool>(type: "INTEGER", nullable: false),
                    ResponseTimeSeconds = table.Column<int>(type: "INTEGER", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewSessionAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewSessionAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReviewSessionAnswers_ReviewSessions_ReviewSessionId",
                        column: x => x.ReviewSessionId,
                        principalTable: "ReviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionStudyProgresses_QuestionId",
                table: "QuestionStudyProgresses",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionStudyProgresses_StudentId_MasteryLevel",
                table: "QuestionStudyProgresses",
                columns: new[] { "StudentId", "MasteryLevel" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionStudyProgresses_StudentId_NextReviewAt_MasteryLevel",
                table: "QuestionStudyProgresses",
                columns: new[] { "StudentId", "NextReviewAt", "MasteryLevel" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionStudyProgresses_StudentId_QuestionId",
                table: "QuestionStudyProgresses",
                columns: new[] { "StudentId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewSessionAnswers_QuestionId_ReviewedAt",
                table: "ReviewSessionAnswers",
                columns: new[] { "QuestionId", "ReviewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewSessionAnswers_ReviewSessionId_QuestionId",
                table: "ReviewSessionAnswers",
                columns: new[] { "ReviewSessionId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewSessions_StudentId_CompletedAt",
                table: "ReviewSessions",
                columns: new[] { "StudentId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ReviewSessions_StudentId_StartedAt",
                table: "ReviewSessions",
                columns: new[] { "StudentId", "StartedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuestionStudyProgresses");

            migrationBuilder.DropTable(
                name: "ReviewSessionAnswers");

            migrationBuilder.DropTable(
                name: "ReviewSessions");
        }
    }
}
