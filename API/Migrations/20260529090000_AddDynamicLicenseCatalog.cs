using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260529090000_AddDynamicLicenseCatalog")]
    public partial class AddDynamicLicenseCatalog : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Licenses",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedStudyHours",
                table: "Licenses",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "IconUrl",
                table: "Licenses",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Licenses",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Licenses",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "Licenses",
                type: "TEXT",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Licenses_IsActive_DisplayOrder",
                table: "Licenses",
                columns: new[] { "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Licenses_IsFeatured_IsActive_DisplayOrder",
                table: "Licenses",
                columns: new[] { "IsFeatured", "IsActive", "DisplayOrder" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Licenses_IsActive_DisplayOrder",
                table: "Licenses");

            migrationBuilder.DropIndex(
                name: "IX_Licenses_IsFeatured_IsActive_DisplayOrder",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "EstimatedStudyHours",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "IconUrl",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "Licenses");
        }
    }
}
