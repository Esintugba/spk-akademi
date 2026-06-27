using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddAdaptiveStudyPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExamDate",
                table: "UserSettings",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredStudyDays",
                table: "UserSettings",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "WeeklyStudyMinutes",
                table: "UserSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AdaptiveStudyPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    PlanDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    EstimatedMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletionRate = table.Column<decimal>(type: "TEXT", precision: 5, scale: 1, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DaysUntilExam = table.Column<int>(type: "INTEGER", nullable: false),
                    EstimatedTargetCompletionRate = table.Column<decimal>(type: "TEXT", precision: 5, scale: 1, nullable: false),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 600, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdaptiveStudyPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdaptiveStudyPlans_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AdaptiveStudyTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlanId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    TopicId = table.Column<Guid>(type: "TEXT", nullable: true),
                    TargetMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetQuestions = table.Column<int>(type: "INTEGER", nullable: false),
                    Priority = table.Column<decimal>(type: "TEXT", precision: 7, scale: 2, nullable: false),
                    ActionUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 600, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdaptiveStudyTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdaptiveStudyTasks_AdaptiveStudyPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "AdaptiveStudyPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AdaptiveStudyTasks_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdaptiveStudyPlans_UserId_GeneratedAt",
                table: "AdaptiveStudyPlans",
                columns: new[] { "UserId", "GeneratedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdaptiveStudyPlans_UserId_PlanDate",
                table: "AdaptiveStudyPlans",
                columns: new[] { "UserId", "PlanDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdaptiveStudyTasks_PlanId_Priority",
                table: "AdaptiveStudyTasks",
                columns: new[] { "PlanId", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_AdaptiveStudyTasks_TopicId",
                table: "AdaptiveStudyTasks",
                column: "TopicId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdaptiveStudyTasks");

            migrationBuilder.DropTable(
                name: "AdaptiveStudyPlans");

            migrationBuilder.DropColumn(
                name: "ExamDate",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "PreferredStudyDays",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "WeeklyStudyMinutes",
                table: "UserSettings");
        }
    }
}
