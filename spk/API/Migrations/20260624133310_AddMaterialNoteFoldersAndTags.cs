using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialNoteFoldersAndTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FolderName",
                table: "MaterialNotes",
                type: "TEXT",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "MaterialNotes",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FolderName",
                table: "MaterialNotes");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "MaterialNotes");
        }
    }
}
