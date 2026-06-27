using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialNoteReviewScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsInReview",
                table: "MaterialNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReviewedAt",
                table: "MaterialNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextReviewAt",
                table: "MaterialNotes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ReviewEaseFactor",
                table: "MaterialNotes",
                type: "TEXT",
                precision: 4,
                scale: 2,
                nullable: false,
                defaultValue: 2.5m);

            migrationBuilder.AddColumn<int>(
                name: "ReviewIntervalDays",
                table: "MaterialNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "ReviewRepetition",
                table: "MaterialNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SuccessfulReviews",
                table: "MaterialNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalReviews",
                table: "MaterialNotes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_MaterialNotes_UserId_IsInReview_NextReviewAt",
                table: "MaterialNotes",
                columns: new[] { "UserId", "IsInReview", "NextReviewAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MaterialNotes_UserId_IsInReview_NextReviewAt",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "IsInReview",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "LastReviewedAt",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "NextReviewAt",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "ReviewEaseFactor",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "ReviewIntervalDays",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "ReviewRepetition",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "SuccessfulReviews",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "TotalReviews",
                table: "MaterialNotes");
        }
    }
}
