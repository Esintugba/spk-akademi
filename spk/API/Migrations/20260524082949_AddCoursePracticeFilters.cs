using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddCoursePracticeFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GeneratedFiltersJson",
                table: "QuizAttempts",
                type: "TEXT",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_CourseId_Mode",
                table: "QuizAttempts",
                columns: new[] { "UserId", "CourseId", "Mode" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_UserId_CourseId_Mode",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "GeneratedFiltersJson",
                table: "QuizAttempts");
        }
    }
}
