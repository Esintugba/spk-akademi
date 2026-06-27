using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialReaderEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MaterialBookmarks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    MaterialId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PageNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialBookmarks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialBookmarks_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MaterialBookmarks_SourceDocuments_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "SourceDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaterialNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    MaterialId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PageNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    SelectedText = table.Column<string>(type: "TEXT", maxLength: 1200, nullable: true),
                    Note = table.Column<string>(type: "TEXT", maxLength: 1500, nullable: false),
                    HighlightColor = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialNotes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MaterialNotes_SourceDocuments_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "SourceDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserMaterialProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    MaterialId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LastPage = table.Column<int>(type: "INTEGER", nullable: false),
                    ProgressPercentage = table.Column<decimal>(type: "TEXT", precision: 5, scale: 1, nullable: false),
                    LastOpenedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TotalSecondsRead = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMaterialProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMaterialProgresses_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMaterialProgresses_SourceDocuments_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "SourceDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialBookmarks_MaterialId",
                table: "MaterialBookmarks",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialBookmarks_UserId_MaterialId",
                table: "MaterialBookmarks",
                columns: new[] { "UserId", "MaterialId" });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialBookmarks_UserId_MaterialId_PageNumber",
                table: "MaterialBookmarks",
                columns: new[] { "UserId", "MaterialId", "PageNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaterialNotes_MaterialId",
                table: "MaterialNotes",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialNotes_UserId_MaterialId",
                table: "MaterialNotes",
                columns: new[] { "UserId", "MaterialId" });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialNotes_UserId_MaterialId_PageNumber",
                table: "MaterialNotes",
                columns: new[] { "UserId", "MaterialId", "PageNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_UserMaterialProgresses_MaterialId",
                table: "UserMaterialProgresses",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMaterialProgresses_UserId_LastOpenedAt",
                table: "UserMaterialProgresses",
                columns: new[] { "UserId", "LastOpenedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserMaterialProgresses_UserId_MaterialId",
                table: "UserMaterialProgresses",
                columns: new[] { "UserId", "MaterialId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaterialBookmarks");

            migrationBuilder.DropTable(
                name: "MaterialNotes");

            migrationBuilder.DropTable(
                name: "UserMaterialProgresses");
        }
    }
}
