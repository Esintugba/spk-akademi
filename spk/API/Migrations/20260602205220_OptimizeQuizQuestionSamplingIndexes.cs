using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeQuizQuestionSamplingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Questions_ReviewStatus_TopicId",
                table: "Questions",
                columns: new[] { "ReviewStatus", "TopicId" });

            migrationBuilder.CreateIndex(
                name: "IX_Questions_TopicId_ReviewStatus_Difficulty",
                table: "Questions",
                columns: new[] { "TopicId", "ReviewStatus", "Difficulty" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Questions_ReviewStatus_TopicId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_TopicId_ReviewStatus_Difficulty",
                table: "Questions");
        }
    }
}
