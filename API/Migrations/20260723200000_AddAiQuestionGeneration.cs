using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations;

[DbContext(typeof(DataContext))]
[Migration("20260723200000_AddAiQuestionGeneration")]
public partial class AddAiQuestionGeneration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AiQuestionGenerationJobs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                SourceDocumentId = table.Column<Guid>(type: "TEXT", nullable: false),
                TopicId = table.Column<Guid>(type: "TEXT", nullable: false),
                RequestedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                StartPage = table.Column<int>(type: "INTEGER", nullable: false),
                EndPage = table.Column<int>(type: "INTEGER", nullable: false),
                EasyQuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                MediumQuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                HardQuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                IncludeExplanations = table.Column<bool>(type: "INTEGER", nullable: false),
                Model = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                Status = table.Column<int>(type: "INTEGER", nullable: false),
                GeneratedQuestionCount = table.Column<int>(type: "INTEGER", nullable: false),
                InputTokens = table.Column<int>(type: "INTEGER", nullable: false),
                OutputTokens = table.Column<int>(type: "INTEGER", nullable: false),
                ErrorMessage = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AiQuestionGenerationJobs", x => x.Id);
                table.ForeignKey(
                    name: "FK_AiQuestionGenerationJobs_AspNetUsers_RequestedByUserId",
                    column: x => x.RequestedByUserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_AiQuestionGenerationJobs_SourceDocuments_SourceDocumentId",
                    column: x => x.SourceDocumentId,
                    principalTable: "SourceDocuments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_AiQuestionGenerationJobs_Topics_TopicId",
                    column: x => x.TopicId,
                    principalTable: "Topics",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "AiQuestionDrafts",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                JobId = table.Column<Guid>(type: "TEXT", nullable: false),
                QuestionText = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                OptionA = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                OptionB = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                OptionC = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                OptionD = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                OptionE = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                CorrectOption = table.Column<string>(type: "TEXT", maxLength: 1, nullable: false),
                Explanation = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                Difficulty = table.Column<int>(type: "INTEGER", nullable: false),
                SourcePage = table.Column<int>(type: "INTEGER", nullable: false),
                SourceExcerpt = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                Status = table.Column<int>(type: "INTEGER", nullable: false),
                PublishedQuestionId = table.Column<Guid>(type: "TEXT", nullable: true),
                ReviewedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                ReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AiQuestionDrafts", x => x.Id);
                table.ForeignKey(
                    name: "FK_AiQuestionDrafts_AiQuestionGenerationJobs_JobId",
                    column: x => x.JobId,
                    principalTable: "AiQuestionGenerationJobs",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_AiQuestionDrafts_AspNetUsers_ReviewedByUserId",
                    column: x => x.ReviewedByUserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_AiQuestionDrafts_Questions_PublishedQuestionId",
                    column: x => x.PublishedQuestionId,
                    principalTable: "Questions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionGenerationJobs_RequestedByUserId",
            table: "AiQuestionGenerationJobs",
            column: "RequestedByUserId");

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionGenerationJobs_SourceDocumentId",
            table: "AiQuestionGenerationJobs",
            column: "SourceDocumentId");

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionGenerationJobs_Status_CreatedAt",
            table: "AiQuestionGenerationJobs",
            columns: new[] { "Status", "CreatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionGenerationJobs_TopicId",
            table: "AiQuestionGenerationJobs",
            column: "TopicId");

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionDrafts_JobId_Status",
            table: "AiQuestionDrafts",
            columns: new[] { "JobId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionDrafts_PublishedQuestionId",
            table: "AiQuestionDrafts",
            column: "PublishedQuestionId");

        migrationBuilder.CreateIndex(
            name: "IX_AiQuestionDrafts_ReviewedByUserId",
            table: "AiQuestionDrafts",
            column: "ReviewedByUserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AiQuestionDrafts");
        migrationBuilder.DropTable(name: "AiQuestionGenerationJobs");
    }
}
