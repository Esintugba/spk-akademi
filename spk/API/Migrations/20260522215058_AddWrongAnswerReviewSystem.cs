using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddWrongAnswerReviewSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_UserId",
                table: "QuizAttempts");

            migrationBuilder.AddColumn<bool>(
                name: "GeneratedFromWrongAnswers",
                table: "QuizAttempts",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "WrongAnswerQueues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StudentId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    WrongCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ReviewCount = table.Column<int>(type: "INTEGER", nullable: false),
                    LastWrongAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NextReviewAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsMastered = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WrongAnswerQueues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WrongAnswerQueues_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WrongAnswerQueues_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WrongAnswerReviewHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StudentId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuizAttemptId = table.Column<Guid>(type: "TEXT", nullable: true),
                    AnsweredCorrect = table.Column<bool>(type: "INTEGER", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ResponseTimeSeconds = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WrongAnswerReviewHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WrongAnswerReviewHistories_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WrongAnswerReviewHistories_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WrongAnswerReviewHistories_QuizAttempts_QuizAttemptId",
                        column: x => x.QuizAttemptId,
                        principalTable: "QuizAttempts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_Mode_GeneratedFromWrongAnswers",
                table: "QuizAttempts",
                columns: new[] { "UserId", "Mode", "GeneratedFromWrongAnswers" });

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerQueues_QuestionId",
                table: "WrongAnswerQueues",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerQueues_StudentId_LastWrongAt",
                table: "WrongAnswerQueues",
                columns: new[] { "StudentId", "LastWrongAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerQueues_StudentId_NextReviewAt_IsMastered",
                table: "WrongAnswerQueues",
                columns: new[] { "StudentId", "NextReviewAt", "IsMastered" });

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerQueues_StudentId_QuestionId",
                table: "WrongAnswerQueues",
                columns: new[] { "StudentId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerReviewHistories_QuestionId",
                table: "WrongAnswerReviewHistories",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerReviewHistories_QuizAttemptId",
                table: "WrongAnswerReviewHistories",
                column: "QuizAttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerReviewHistories_StudentId_QuestionId_ReviewedAt",
                table: "WrongAnswerReviewHistories",
                columns: new[] { "StudentId", "QuestionId", "ReviewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WrongAnswerReviewHistories_StudentId_ReviewedAt",
                table: "WrongAnswerReviewHistories",
                columns: new[] { "StudentId", "ReviewedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WrongAnswerQueues");

            migrationBuilder.DropTable(
                name: "WrongAnswerReviewHistories");

            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_UserId_Mode_GeneratedFromWrongAnswers",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "GeneratedFromWrongAnswers",
                table: "QuizAttempts");

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId",
                table: "QuizAttempts",
                column: "UserId");
        }
    }
}
