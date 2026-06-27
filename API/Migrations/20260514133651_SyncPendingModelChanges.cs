using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StudyProgresses_UserId",
                table: "StudyProgresses");

            migrationBuilder.CreateIndex(
                name: "IX_StudyProgresses_TopicId",
                table: "StudyProgresses",
                column: "TopicId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StudyProgresses_TopicId",
                table: "StudyProgresses");

            migrationBuilder.CreateIndex(
                name: "IX_StudyProgresses_UserId",
                table: "StudyProgresses",
                column: "UserId");
        }
    }
}
