using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations;

[DbContext(typeof(DataContext))]
[Migration("20260723103000_AddAccessRequestDecisionAudit")]
public partial class AddAccessRequestDecisionAudit : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AccessRequestAccessGrants",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                AccessRequestId = table.Column<Guid>(type: "TEXT", nullable: false),
                LicenseId = table.Column<Guid>(type: "TEXT", nullable: false),
                UserLicenseAccessId = table.Column<Guid>(type: "TEXT", nullable: false),
                WasCreated = table.Column<bool>(type: "INTEGER", nullable: false),
                PreviousStartDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                PreviousEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                PreviousIsActive = table.Column<bool>(type: "INTEGER", nullable: true),
                PreviousAccessSource = table.Column<int>(type: "INTEGER", nullable: true),
                PreviousIsDemoAccess = table.Column<bool>(type: "INTEGER", nullable: true),
                PreviousGrantedAutomatically = table.Column<bool>(type: "INTEGER", nullable: true),
                PreviousExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                AppliedStartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                AppliedEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                AppliedIsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                AppliedAccessSource = table.Column<int>(type: "INTEGER", nullable: false),
                AppliedIsDemoAccess = table.Column<bool>(type: "INTEGER", nullable: false),
                AppliedGrantedAutomatically = table.Column<bool>(type: "INTEGER", nullable: false),
                AppliedExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                AppliedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                RevertedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccessRequestAccessGrants", x => x.Id);
                table.ForeignKey(
                    name: "FK_AccessRequestAccessGrants_AccessRequests_AccessRequestId",
                    column: x => x.AccessRequestId,
                    principalTable: "AccessRequests",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_AccessRequestAccessGrants_Licenses_LicenseId",
                    column: x => x.LicenseId,
                    principalTable: "Licenses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "AccessRequestHistories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                AccessRequestId = table.Column<Guid>(type: "TEXT", nullable: false),
                FromStatus = table.Column<int>(type: "INTEGER", nullable: false),
                ToStatus = table.Column<int>(type: "INTEGER", nullable: false),
                AdminNote = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                CorrectionReason = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                IsCorrection = table.Column<bool>(type: "INTEGER", nullable: false),
                ChangedByUserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                ChangedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccessRequestHistories", x => x.Id);
                table.ForeignKey(
                    name: "FK_AccessRequestHistories_AccessRequests_AccessRequestId",
                    column: x => x.AccessRequestId,
                    principalTable: "AccessRequests",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_AccessRequestHistories_AspNetUsers_ChangedByUserId",
                    column: x => x.ChangedByUserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AccessRequestAccessGrants_AccessRequestId_LicenseId",
            table: "AccessRequestAccessGrants",
            columns: new[] { "AccessRequestId", "LicenseId" });

        migrationBuilder.CreateIndex(
            name: "IX_AccessRequestAccessGrants_LicenseId",
            table: "AccessRequestAccessGrants",
            column: "LicenseId");

        migrationBuilder.CreateIndex(
            name: "IX_AccessRequestAccessGrants_UserLicenseAccessId",
            table: "AccessRequestAccessGrants",
            column: "UserLicenseAccessId");

        migrationBuilder.CreateIndex(
            name: "IX_AccessRequestHistories_AccessRequestId_ChangedAt",
            table: "AccessRequestHistories",
            columns: new[] { "AccessRequestId", "ChangedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_AccessRequestHistories_ChangedByUserId",
            table: "AccessRequestHistories",
            column: "ChangedByUserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AccessRequestAccessGrants");
        migrationBuilder.DropTable(name: "AccessRequestHistories");
    }
}
