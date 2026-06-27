using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260528013000_AddQuizCatalogSystem")]
    public partial class AddQuizCatalogSystem : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DifficultyLevel",
                table: "TrialExams",
                type: "INTEGER",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "TrialExams",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PopularityScore",
                table: "TrialExams",
                type: "TEXT",
                precision: 9,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "TrialExams",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_IsFeatured_IsPublished_PopularityScore",
                table: "TrialExams",
                columns: new[] { "IsFeatured", "IsPublished", "PopularityScore" });

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_IsPublished_IsDeleted_CreatedAt",
                table: "TrialExams",
                columns: new[] { "IsPublished", "IsDeleted", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TrialExams_LicenseId_IsPublished_DifficultyLevel",
                table: "TrialExams",
                columns: new[] { "LicenseId", "IsPublished", "DifficultyLevel" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TrialExams_IsFeatured_IsPublished_PopularityScore",
                table: "TrialExams");

            migrationBuilder.DropIndex(
                name: "IX_TrialExams_IsPublished_IsDeleted_CreatedAt",
                table: "TrialExams");

            migrationBuilder.DropIndex(
                name: "IX_TrialExams_LicenseId_IsPublished_DifficultyLevel",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "DifficultyLevel",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "PopularityScore",
                table: "TrialExams");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "TrialExams");
        }
    }
}
