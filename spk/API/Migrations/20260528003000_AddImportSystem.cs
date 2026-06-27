using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260528003000_AddImportSystem")]
    public partial class AddImportSystem : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImportJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 260, nullable: false),
                    ImportType = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalRows = table.Column<int>(type: "INTEGER", nullable: false),
                    SuccessfulRows = table.Column<int>(type: "INTEGER", nullable: false),
                    FailedRows = table.Column<int>(type: "INTEGER", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    ErrorReportUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    StoredFilePath = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImportJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImportJobs_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DuplicateQuestionMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MatchedQuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SimilarityScore = table.Column<decimal>(type: "TEXT", precision: 5, scale: 3, nullable: false),
                    MatchType = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DuplicateQuestionMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DuplicateQuestionMatches_Questions_MatchedQuestionId",
                        column: x => x.MatchedQuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DuplicateQuestionMatches_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImportErrors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ImportJobId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RowNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    ColumnName = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    ErrorMessage = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    RawData = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImportErrors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImportErrors_ImportJobs_ImportJobId",
                        column: x => x.ImportJobId,
                        principalTable: "ImportJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImportJobs_CreatedByUserId",
                table: "ImportJobs",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ImportJobs_ImportType_Status_CreatedAt",
                table: "ImportJobs",
                columns: new[] { "ImportType", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DuplicateQuestionMatches_MatchedQuestionId",
                table: "DuplicateQuestionMatches",
                column: "MatchedQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_DuplicateQuestionMatches_MatchType_SimilarityScore",
                table: "DuplicateQuestionMatches",
                columns: new[] { "MatchType", "SimilarityScore" });

            migrationBuilder.CreateIndex(
                name: "IX_DuplicateQuestionMatches_QuestionId_MatchedQuestionId",
                table: "DuplicateQuestionMatches",
                columns: new[] { "QuestionId", "MatchedQuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImportErrors_ImportJobId_RowNumber",
                table: "ImportErrors",
                columns: new[] { "ImportJobId", "RowNumber" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DuplicateQuestionMatches");
            migrationBuilder.DropTable(name: "ImportErrors");
            migrationBuilder.DropTable(name: "ImportJobs");
        }
    }
}
