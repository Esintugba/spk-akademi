using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToStudyProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StudyProgresses_TopicId",
                table: "StudyProgresses");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "StudyProgresses",
                type: "TEXT",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudyProgresses_UserId",
                table: "StudyProgresses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudyProgresses_UserId_TopicId",
                table: "StudyProgresses",
                columns: new[] { "UserId", "TopicId" },
                unique: true);

            // SQLite cannot add a foreign key to an existing table without rebuilding it.
            // UserId is still written and indexed; EF model keeps the relationship for new schemas.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StudyProgresses_UserId",
                table: "StudyProgresses");

            migrationBuilder.DropIndex(
                name: "IX_StudyProgresses_UserId_TopicId",
                table: "StudyProgresses");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "StudyProgresses");

            migrationBuilder.CreateIndex(
                name: "IX_StudyProgresses_TopicId",
                table: "StudyProgresses",
                column: "TopicId",
                unique: true);
        }
    }
}
