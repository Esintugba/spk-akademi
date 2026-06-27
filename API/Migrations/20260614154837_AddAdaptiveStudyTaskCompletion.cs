using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddAdaptiveStudyTaskCompletion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActualMinutes",
                table: "AdaptiveStudyTasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ActualQuestions",
                table: "AdaptiveStudyTasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Completed",
                table: "AdaptiveStudyTasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "AdaptiveStudyTasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdaptiveStudyTasks_Completed_CompletedAt",
                table: "AdaptiveStudyTasks",
                columns: new[] { "Completed", "CompletedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AdaptiveStudyTasks_Completed_CompletedAt",
                table: "AdaptiveStudyTasks");

            migrationBuilder.DropColumn(
                name: "ActualMinutes",
                table: "AdaptiveStudyTasks");

            migrationBuilder.DropColumn(
                name: "ActualQuestions",
                table: "AdaptiveStudyTasks");

            migrationBuilder.DropColumn(
                name: "Completed",
                table: "AdaptiveStudyTasks");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "AdaptiveStudyTasks");
        }
    }
}
