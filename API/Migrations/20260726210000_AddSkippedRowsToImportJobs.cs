using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations;

[DbContext(typeof(DataContext))]
[Migration("20260726210000_AddSkippedRowsToImportJobs")]
public partial class AddSkippedRowsToImportJobs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SkippedRows",
            table: "ImportJobs",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "SkippedRows",
            table: "ImportJobs");
    }
}
