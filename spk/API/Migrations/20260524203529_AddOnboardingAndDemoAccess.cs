using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingAndDemoAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "UserLicenseAccesses",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "GrantedAutomatically",
                table: "UserLicenseAccesses",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDemoAccess",
                table: "UserLicenseAccesses",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "UserOnboardingStates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    HasSeenWelcome = table.Column<bool>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CurrentStep = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserOnboardingStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserOnboardingStates_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserLicenseAccesses_ExpiresAt",
                table: "UserLicenseAccesses",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserLicenseAccesses_UserId_IsDemoAccess_IsActive",
                table: "UserLicenseAccesses",
                columns: new[] { "UserId", "IsDemoAccess", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_UserOnboardingStates_UserId",
                table: "UserOnboardingStates",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserOnboardingStates");

            migrationBuilder.DropIndex(
                name: "IX_UserLicenseAccesses_ExpiresAt",
                table: "UserLicenseAccesses");

            migrationBuilder.DropIndex(
                name: "IX_UserLicenseAccesses_UserId_IsDemoAccess_IsActive",
                table: "UserLicenseAccesses");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "UserLicenseAccesses");

            migrationBuilder.DropColumn(
                name: "GrantedAutomatically",
                table: "UserLicenseAccesses");

            migrationBuilder.DropColumn(
                name: "IsDemoAccess",
                table: "UserLicenseAccesses");
        }
    }
}
