using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20260524235900_AddGamificationSystem")]
    public partial class AddGamificationSystem : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Badges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    IconUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    XPReward = table.Column<int>(type: "INTEGER", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    RequirementType = table.Column<int>(type: "INTEGER", nullable: false),
                    RequirementValue = table.Column<int>(type: "INTEGER", nullable: false),
                    IsHidden = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table => { table.PrimaryKey("PK_Badges", x => x.Id); });

            migrationBuilder.CreateTable(
                name: "DailyGoals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    GoalType = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetValue = table.Column<int>(type: "INTEGER", nullable: false),
                    XPReward = table.Column<int>(type: "INTEGER", nullable: false),
                    ActiveDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table => { table.PrimaryKey("PK_DailyGoals", x => x.Id); });

            migrationBuilder.CreateTable(
                name: "UserGamificationProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    Level = table.Column<int>(type: "INTEGER", nullable: false),
                    XP = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalXP = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentStreak = table.Column<int>(type: "INTEGER", nullable: false),
                    LongestStreak = table.Column<int>(type: "INTEGER", nullable: false),
                    DailyGoalCompleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastActivityAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Rank = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserGamificationProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserGamificationProfiles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "XPTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    Amount = table.Column<int>(type: "INTEGER", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    ReferenceType = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    ReferenceId = table.Column<string>(type: "TEXT", maxLength: 160, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XPTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_XPTransactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserBadges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    BadgeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Progress = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBadges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserBadges_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserBadges_Badges_BadgeId",
                        column: x => x.BadgeId,
                        principalTable: "Badges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserDailyGoals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    DailyGoalId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Progress = table.Column<int>(type: "INTEGER", nullable: false),
                    Completed = table.Column<bool>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDailyGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDailyGoals_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserDailyGoals_DailyGoals_DailyGoalId",
                        column: x => x.DailyGoalId,
                        principalTable: "DailyGoals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_Badges_Name", table: "Badges", column: "Name", unique: true);
            migrationBuilder.CreateIndex(name: "IX_DailyGoals_ActiveDate_GoalType_TargetValue", table: "DailyGoals", columns: new[] { "ActiveDate", "GoalType", "TargetValue" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_UserBadges_UserId_BadgeId", table: "UserBadges", columns: new[] { "UserId", "BadgeId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_UserBadges_UserId_UnlockedAt", table: "UserBadges", columns: new[] { "UserId", "UnlockedAt" });
            migrationBuilder.CreateIndex(name: "IX_UserBadges_BadgeId", table: "UserBadges", column: "BadgeId");
            migrationBuilder.CreateIndex(name: "IX_UserDailyGoals_UserId_DailyGoalId", table: "UserDailyGoals", columns: new[] { "UserId", "DailyGoalId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_UserDailyGoals_UserId_Completed_CompletedAt", table: "UserDailyGoals", columns: new[] { "UserId", "Completed", "CompletedAt" });
            migrationBuilder.CreateIndex(name: "IX_UserDailyGoals_DailyGoalId", table: "UserDailyGoals", column: "DailyGoalId");
            migrationBuilder.CreateIndex(name: "IX_UserGamificationProfiles_UserId", table: "UserGamificationProfiles", column: "UserId", unique: true);
            migrationBuilder.CreateIndex(name: "IX_UserGamificationProfiles_TotalXP_Level", table: "UserGamificationProfiles", columns: new[] { "TotalXP", "Level" });
            migrationBuilder.CreateIndex(name: "IX_UserGamificationProfiles_CurrentStreak", table: "UserGamificationProfiles", column: "CurrentStreak");
            migrationBuilder.CreateIndex(name: "IX_XPTransactions_UserId_CreatedAt", table: "XPTransactions", columns: new[] { "UserId", "CreatedAt" });
            migrationBuilder.CreateIndex(name: "IX_XPTransactions_UserId_ReferenceType_ReferenceId", table: "XPTransactions", columns: new[] { "UserId", "ReferenceType", "ReferenceId" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserBadges");
            migrationBuilder.DropTable(name: "UserDailyGoals");
            migrationBuilder.DropTable(name: "UserGamificationProfiles");
            migrationBuilder.DropTable(name: "XPTransactions");
            migrationBuilder.DropTable(name: "Badges");
            migrationBuilder.DropTable(name: "DailyGoals");
        }
    }
}
