using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddTrialPurchasesAndAttemptStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "QuizAttempts",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "TrialExamPurchases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    TrialExamId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PurchasedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrialExamPurchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrialExamPurchases_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TrialExamPurchases_TrialExams_TrialExamId",
                        column: x => x.TrialExamId,
                        principalTable: "TrialExams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrialExamPurchases_TrialExamId",
                table: "TrialExamPurchases",
                column: "TrialExamId");

            migrationBuilder.CreateIndex(
                name: "IX_TrialExamPurchases_UserId_TrialExamId",
                table: "TrialExamPurchases",
                columns: new[] { "UserId", "TrialExamId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrialExamPurchases");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "QuizAttempts");
        }
    }
}
