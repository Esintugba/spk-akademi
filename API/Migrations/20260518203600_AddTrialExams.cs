using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialExams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TrialExamId",
                table: "QuizAttempts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TrialExams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 250, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 280, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    LicenseId = table.Column<Guid>(type: "TEXT", nullable: true),
                    DurationMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    QuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IsFree = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPublished = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrialExams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrialExams_Licenses_LicenseId",
                        column: x => x.LicenseId,
                        principalTable: "Licenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TrialExamQuestions",
                columns: table => new
                {
                    TrialExamId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrialExamQuestions", x => new { x.TrialExamId, x.QuestionId });
                    table.ForeignKey(
                        name: "FK_TrialExamQuestions_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TrialExamQuestions_TrialExams_TrialExamId",
                        column: x => x.TrialExamId,
                        principalTable: "TrialExams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_TrialExamId",
                table: "QuizAttempts",
                column: "TrialExamId");

            migrationBuilder.CreateIndex(
                name: "IX_TrialExamQuestions_QuestionId",
                table: "TrialExamQuestions",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_TrialExamQuestions_TrialExamId_Order",
                table: "TrialExamQuestions",
                columns: new[] { "TrialExamId", "Order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_LicenseId",
                table: "TrialExams",
                column: "LicenseId");

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_Slug",
                table: "TrialExams",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizAttempts_TrialExams_TrialExamId",
                table: "QuizAttempts",
                column: "TrialExamId",
                principalTable: "TrialExams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuizAttempts_TrialExams_TrialExamId",
                table: "QuizAttempts");

            migrationBuilder.DropTable(
                name: "TrialExamQuestions");

            migrationBuilder.DropTable(
                name: "TrialExams");

            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_TrialExamId",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "TrialExamId",
                table: "QuizAttempts");
        }
    }
}
