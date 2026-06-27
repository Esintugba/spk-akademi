using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddAccessRequestSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccessRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    StudentId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    LicenseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    AdminNote = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                    EmailSent = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessRequests_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccessRequests_AspNetUsers_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AccessRequests_Licenses_LicenseId",
                        column: x => x.LicenseId,
                        principalTable: "Licenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_LicenseId",
                table: "AccessRequests",
                column: "LicenseId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_RequestedAt",
                table: "AccessRequests",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_ReviewedByUserId",
                table: "AccessRequests",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_Status_RequestedAt",
                table: "AccessRequests",
                columns: new[] { "Status", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_StudentId_LicenseId_Status",
                table: "AccessRequests",
                columns: new[] { "StudentId", "LicenseId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessRequests");
        }
    }
}
