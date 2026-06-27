using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddTopicTypeAndCurriculumFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CriticalThresholds",
                table: "Topics",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExamNotes",
                table: "Topics",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Topics",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql("UPDATE Topics SET Type = CASE WHEN ParentTopicId IS NULL THEN 1 ELSE 2 END");

            migrationBuilder.CreateIndex(
                name: "IX_Topics_CourseId_Type_Order",
                table: "Topics",
                columns: new[] { "CourseId", "Type", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_Topics_ParentTopicId_Type_Order",
                table: "Topics",
                columns: new[] { "ParentTopicId", "Type", "Order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Topics_CourseId_Type_Order",
                table: "Topics");

            migrationBuilder.DropIndex(
                name: "IX_Topics_ParentTopicId_Type_Order",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "CriticalThresholds",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "ExamNotes",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Topics");
        }
    }
}
