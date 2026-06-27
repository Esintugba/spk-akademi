using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddPastExamMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "GeneratedFromPastExams",
                table: "QuizAttempts",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PastExamFilterJson",
                table: "QuizAttempts",
                type: "TEXT",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExamSession",
                table: "Questions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExamType",
                table: "Questions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExamYear",
                table: "Questions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPastExamQuestion",
                table: "Questions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_IsPastExamQuestion_ExamYear_ExamType",
                table: "Questions",
                columns: new[] { "IsPastExamQuestion", "ExamYear", "ExamType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Questions_IsPastExamQuestion_ExamYear_ExamType",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "GeneratedFromPastExams",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "PastExamFilterJson",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "ExamSession",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ExamType",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ExamYear",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "IsPastExamQuestion",
                table: "Questions");
        }
    }
}
