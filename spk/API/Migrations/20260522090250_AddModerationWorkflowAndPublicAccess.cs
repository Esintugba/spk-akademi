using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationWorkflowAndPublicAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "TrialExams",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "TrialExams",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "TrialExams",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "TrialExams",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewStatus",
                table: "TrialExams",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "TrialExams",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedById",
                table: "TrialExams",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "StudyNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "StudyNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StudyNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "StudyNotes",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "StudyNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedById",
                table: "StudyNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "SourceDocuments",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "SourceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "SourceDocuments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "SourceDocuments",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewStatus",
                table: "SourceDocuments",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "SourceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedById",
                table: "SourceDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "Questions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Questions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Questions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReviewComment",
                table: "Questions",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Questions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedById",
                table: "Questions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ModerationHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    ContentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FromStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    ToStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    ReviewerId = table.Column<string>(type: "TEXT", nullable: true),
                    Comment = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModerationHistories_AspNetUsers_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_ReviewedById",
                table: "TrialExams",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_ReviewStatus_IsDeleted",
                table: "TrialExams",
                columns: new[] { "ReviewStatus", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_StudyNotes_ReviewedById",
                table: "StudyNotes",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_StudyNotes_ReviewStatus_IsDeleted",
                table: "StudyNotes",
                columns: new[] { "ReviewStatus", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_SourceDocuments_ReviewedById",
                table: "SourceDocuments",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_SourceDocuments_ReviewStatus_IsDeleted",
                table: "SourceDocuments",
                columns: new[] { "ReviewStatus", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_ReviewedById",
                table: "Questions",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_ReviewStatus_IsDeleted",
                table: "Questions",
                columns: new[] { "ReviewStatus", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationHistories_ContentType_ContentId_CreatedAt",
                table: "ModerationHistories",
                columns: new[] { "ContentType", "ContentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationHistories_ReviewerId",
                table: "ModerationHistories",
                column: "ReviewerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_AspNetUsers_ReviewedById",
                table: "Questions",
                column: "ReviewedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SourceDocuments_AspNetUsers_ReviewedById",
                table: "SourceDocuments",
                column: "ReviewedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_StudyNotes_AspNetUsers_ReviewedById",
                table: "StudyNotes",
                column: "ReviewedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TrialExams_AspNetUsers_ReviewedById",
                table: "TrialExams",
                column: "ReviewedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_AspNetUsers_ReviewedById",
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_SourceDocuments_AspNetUsers_ReviewedById",
                table: "SourceDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_StudyNotes_AspNetUsers_ReviewedById",
                table: "StudyNotes");

            migrationBuilder.DropForeignKey(
                name: "FK_TrialExams_AspNetUsers_ReviewedById",
                table: "TrialExams");

            migrationBuilder.DropTable(
                name: "ModerationHistories");

            migrationBuilder.DropIndex(
                name: "IX_TrialExams_ReviewedById",
                table: "TrialExams");

            migrationBuilder.DropIndex(
                name: "IX_TrialExams_ReviewStatus_IsDeleted",
                table: "TrialExams");

            migrationBuilder.DropIndex(
                name: "IX_StudyNotes_ReviewedById",
                table: "StudyNotes");

            migrationBuilder.DropIndex(
                name: "IX_StudyNotes_ReviewStatus_IsDeleted",
                table: "StudyNotes");

            migrationBuilder.DropIndex(
                name: "IX_SourceDocuments_ReviewedById",
                table: "SourceDocuments");

            migrationBuilder.DropIndex(
                name: "IX_SourceDocuments_ReviewStatus_IsDeleted",
                table: "SourceDocuments");

            migrationBuilder.DropIndex(
                name: "IX_Questions_ReviewedById",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_ReviewStatus_IsDeleted",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "ReviewedById",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "StudyNotes");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "StudyNotes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StudyNotes");

            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "StudyNotes");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "StudyNotes");

            migrationBuilder.DropColumn(
                name: "ReviewedById",
                table: "StudyNotes");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "ReviewStatus",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "ReviewedById",
                table: "SourceDocuments");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ReviewComment",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ReviewedById",
                table: "Questions");
        }
    }
}
