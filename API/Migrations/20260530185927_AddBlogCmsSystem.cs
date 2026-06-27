using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    public partial class AddBlogCmsSystem : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BlogCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 140, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_BlogCategories", x => x.Id));

            migrationBuilder.CreateTable(
                name: "BlogTags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 140, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_BlogTags", x => x.Id));

            migrationBuilder.CreateTable(
                name: "BlogPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 220, nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 240, nullable: false),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 600, nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "TEXT", maxLength: 700, nullable: true),
                    AuthorId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: true),
                    CategoryId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MetaTitle = table.Column<string>(type: "TEXT", maxLength: 220, nullable: true),
                    MetaDescription = table.Column<string>(type: "TEXT", maxLength: 320, nullable: true),
                    CanonicalUrl = table.Column<string>(type: "TEXT", maxLength: 700, nullable: true),
                    ReadingTime = table.Column<int>(type: "INTEGER", nullable: false),
                    ViewCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BlogPosts_AspNetUsers_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BlogPosts_BlogCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "BlogCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BlogPostTags",
                columns: table => new
                {
                    BlogPostId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TagId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogPostTags", x => new { x.BlogPostId, x.TagId });
                    table.ForeignKey(
                        name: "FK_BlogPostTags_BlogPosts_BlogPostId",
                        column: x => x.BlogPostId,
                        principalTable: "BlogPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BlogPostTags_BlogTags_TagId",
                        column: x => x.TagId,
                        principalTable: "BlogTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "BlogCategories",
                columns: new[] { "Id", "Name", "Slug", "Description", "DisplayOrder", "CreatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "SPK Lisansları", "spk-lisanslari", "SPK lisans turleri ve hazirlik rehberleri.", 1, DateTime.UtcNow },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "SPL Lisansları", "spl-lisanslari", "SPL lisanslari ve sinav kapsam rehberleri.", 2, DateTime.UtcNow },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Sınav Hazırlık", "sinav-hazirlik", "Calisma programi, taktikler ve cikmis soru rehberleri.", 3, DateTime.UtcNow }
                });

            migrationBuilder.CreateIndex(name: "IX_BlogCategories_DisplayOrder", table: "BlogCategories", column: "DisplayOrder");
            migrationBuilder.CreateIndex(name: "IX_BlogCategories_Slug", table: "BlogCategories", column: "Slug", unique: true);
            migrationBuilder.CreateIndex(name: "IX_BlogTags_Slug", table: "BlogTags", column: "Slug", unique: true);
            migrationBuilder.CreateIndex(name: "IX_BlogPosts_AuthorId", table: "BlogPosts", column: "AuthorId");
            migrationBuilder.CreateIndex(name: "IX_BlogPosts_CategoryId_Status_PublishedAt", table: "BlogPosts", columns: new[] { "CategoryId", "Status", "PublishedAt" });
            migrationBuilder.CreateIndex(name: "IX_BlogPosts_Slug", table: "BlogPosts", column: "Slug", unique: true);
            migrationBuilder.CreateIndex(name: "IX_BlogPosts_Status_PublishedAt_IsDeleted", table: "BlogPosts", columns: new[] { "Status", "PublishedAt", "IsDeleted" });
            migrationBuilder.CreateIndex(name: "IX_BlogPosts_ViewCount", table: "BlogPosts", column: "ViewCount");
            migrationBuilder.CreateIndex(name: "IX_BlogPostTags_TagId", table: "BlogPostTags", column: "TagId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "BlogPostTags");
            migrationBuilder.DropTable(name: "BlogPosts");
            migrationBuilder.DropTable(name: "BlogTags");
            migrationBuilder.DropTable(name: "BlogCategories");
        }
    }
}
