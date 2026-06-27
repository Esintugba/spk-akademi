using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260527235000_AddContactMessages")]
    public partial class AddContactMessages : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 254, nullable: false),
                    Subject = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    IpAddress = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "TEXT", maxLength: 512, nullable: true),
                    ReadAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RepliedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AssignedToUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                    AdminNote = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactMessages_AspNetUsers_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_AssignedToUserId",
                table: "ContactMessages",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_Email_CreatedAt",
                table: "ContactMessages",
                columns: new[] { "Email", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_IpAddress_CreatedAt",
                table: "ContactMessages",
                columns: new[] { "IpAddress", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_ReadAt",
                table: "ContactMessages",
                column: "ReadAt");

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_Status_CreatedAt",
                table: "ContactMessages",
                columns: new[] { "Status", "CreatedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ContactMessages");
        }
    }
}
