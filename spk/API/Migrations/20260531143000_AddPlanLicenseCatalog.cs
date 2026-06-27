using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260531143000_AddPlanLicenseCatalog")]
    public partial class AddPlanLicenseCatalog : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 220, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ShortDescription = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsFeatured = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlanLicenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlanId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LicenseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanLicenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanLicenses_Licenses_LicenseId",
                        column: x => x.LicenseId,
                        principalTable: "Licenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanLicenses_Plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                INSERT INTO Plans (Id, Name, Slug, Description, ShortDescription, DisplayOrder, IsFeatured, IsActive, CreatedAt, UpdatedAt)
                SELECT Id, Name, Slug, Description, ShortDescription, DisplayOrder, IsFeatured, IsActive, CreatedAt, UpdatedAt
                FROM Licenses
                WHERE Id NOT IN (SELECT Id FROM Plans)
                """);

            migrationBuilder.Sql("""
                INSERT INTO PlanLicenses (Id, PlanId, LicenseId, CreatedAt, UpdatedAt)
                SELECT Id, Id, Id, CreatedAt, NULL
                FROM Licenses
                WHERE Id NOT IN (SELECT Id FROM PlanLicenses)
                """);

            migrationBuilder.Sql("""
                CREATE TABLE AccessRequests_new (
                    Id TEXT NOT NULL CONSTRAINT PK_AccessRequests PRIMARY KEY,
                    StudentId TEXT NOT NULL,
                    PlanId TEXT NOT NULL,
                    Status INTEGER NOT NULL,
                    Message TEXT NULL,
                    AdminNote TEXT NULL,
                    RequestedAt TEXT NOT NULL,
                    ReviewedAt TEXT NULL,
                    ReviewedByUserId TEXT NULL,
                    EmailSent INTEGER NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CONSTRAINT FK_AccessRequests_AspNetUsers_ReviewedByUserId FOREIGN KEY (ReviewedByUserId) REFERENCES AspNetUsers (Id) ON DELETE SET NULL,
                    CONSTRAINT FK_AccessRequests_AspNetUsers_StudentId FOREIGN KEY (StudentId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE,
                    CONSTRAINT FK_AccessRequests_Plans_PlanId FOREIGN KEY (PlanId) REFERENCES Plans (Id) ON DELETE RESTRICT
                );

                INSERT INTO AccessRequests_new (
                    Id, StudentId, PlanId, Status, Message, AdminNote, RequestedAt, ReviewedAt,
                    ReviewedByUserId, EmailSent, CreatedAt, UpdatedAt
                )
                SELECT
                    Id, StudentId, LicenseId, Status, Message, AdminNote, RequestedAt, ReviewedAt,
                    ReviewedByUserId, EmailSent, CreatedAt, UpdatedAt
                FROM AccessRequests;

                DROP TABLE AccessRequests;
                ALTER TABLE AccessRequests_new RENAME TO AccessRequests;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_PlanId",
                table: "AccessRequests",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_StudentId_PlanId_Status",
                table: "AccessRequests",
                columns: new[] { "StudentId", "PlanId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanLicenses_LicenseId",
                table: "PlanLicenses",
                column: "LicenseId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanLicenses_PlanId_LicenseId",
                table: "PlanLicenses",
                columns: new[] { "PlanId", "LicenseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Plans_IsActive_DisplayOrder",
                table: "Plans",
                columns: new[] { "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Plans_IsFeatured_IsActive_DisplayOrder",
                table: "Plans",
                columns: new[] { "IsFeatured", "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Plans_Slug",
                table: "Plans",
                column: "Slug",
                unique: true);

        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE AccessRequests_old (
                    Id TEXT NOT NULL CONSTRAINT PK_AccessRequests PRIMARY KEY,
                    StudentId TEXT NOT NULL,
                    LicenseId TEXT NOT NULL,
                    Status INTEGER NOT NULL,
                    Message TEXT NULL,
                    AdminNote TEXT NULL,
                    RequestedAt TEXT NOT NULL,
                    ReviewedAt TEXT NULL,
                    ReviewedByUserId TEXT NULL,
                    EmailSent INTEGER NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NULL,
                    CONSTRAINT FK_AccessRequests_AspNetUsers_ReviewedByUserId FOREIGN KEY (ReviewedByUserId) REFERENCES AspNetUsers (Id) ON DELETE SET NULL,
                    CONSTRAINT FK_AccessRequests_AspNetUsers_StudentId FOREIGN KEY (StudentId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE,
                    CONSTRAINT FK_AccessRequests_Licenses_LicenseId FOREIGN KEY (LicenseId) REFERENCES Licenses (Id) ON DELETE RESTRICT
                );

                INSERT INTO AccessRequests_old (
                    Id, StudentId, LicenseId, Status, Message, AdminNote, RequestedAt, ReviewedAt,
                    ReviewedByUserId, EmailSent, CreatedAt, UpdatedAt
                )
                SELECT
                    Id, StudentId, PlanId, Status, Message, AdminNote, RequestedAt, ReviewedAt,
                    ReviewedByUserId, EmailSent, CreatedAt, UpdatedAt
                FROM AccessRequests;

                DROP TABLE AccessRequests;
                ALTER TABLE AccessRequests_old RENAME TO AccessRequests;
                """);

            migrationBuilder.DropTable(
                name: "PlanLicenses");

            migrationBuilder.DropTable(
                name: "Plans");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_LicenseId",
                table: "AccessRequests",
                column: "LicenseId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_StudentId_LicenseId_Status",
                table: "AccessRequests",
                columns: new[] { "StudentId", "LicenseId", "Status" });

        }
    }
}
