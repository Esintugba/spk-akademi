using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizSessionResumeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAt",
                table: "QuizAttempts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_Status_LastActivityAt",
                table: "QuizAttempts",
                columns: new[] { "UserId", "Status", "LastActivityAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_UserId_Status_LastActivityAt",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "LastActivityAt",
                table: "QuizAttempts");
        }
    }
}
