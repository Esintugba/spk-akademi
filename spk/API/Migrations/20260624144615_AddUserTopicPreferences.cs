using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTopicPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserTopicPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    TopicId = table.Column<Guid>(type: "TEXT", nullable: false),
                    IsFavorite = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsInWeeklyPlan = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTopicPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserTopicPreferences_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserTopicPreferences_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserTopicPreferences_TopicId",
                table: "UserTopicPreferences",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_UserTopicPreferences_UserId_IsFavorite",
                table: "UserTopicPreferences",
                columns: new[] { "UserId", "IsFavorite" });

            migrationBuilder.CreateIndex(
                name: "IX_UserTopicPreferences_UserId_IsInWeeklyPlan",
                table: "UserTopicPreferences",
                columns: new[] { "UserId", "IsInWeeklyPlan" });

            migrationBuilder.CreateIndex(
                name: "IX_UserTopicPreferences_UserId_TopicId",
                table: "UserTopicPreferences",
                columns: new[] { "UserId", "TopicId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserTopicPreferences");
        }
    }
}
