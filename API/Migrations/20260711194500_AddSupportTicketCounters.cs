using System;
using API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(DataContext))]
    [Migration("20260711194500_AddSupportTicketCounters")]
    public partial class AddSupportTicketCounters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SupportTicketCounters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DateKey = table.Column<string>(type: "TEXT", maxLength: 8, nullable: false),
                    LastNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTicketCounters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicketCounters_DateKey",
                table: "SupportTicketCounters",
                column: "DateKey",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "SupportTicketCounters" ("Id", "DateKey", "LastNumber", "CreatedAt", "UpdatedAt")
                SELECT
                    lower(hex(randomblob(4))) || '-' ||
                    lower(hex(randomblob(2))) || '-' ||
                    lower(hex(randomblob(2))) || '-' ||
                    lower(hex(randomblob(2))) || '-' ||
                    lower(hex(randomblob(6))) AS "Id",
                    "DateKey",
                    "LastNumber",
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                FROM (
                    SELECT
                        substr("TicketNumber", 5, 8) AS "DateKey",
                        MAX(CAST(substr("TicketNumber", 14) AS INTEGER)) AS "LastNumber"
                    FROM "SupportTickets"
                    WHERE length("TicketNumber") >= 17
                        AND substr("TicketNumber", 1, 4) = 'SPK-'
                    GROUP BY substr("TicketNumber", 5, 8)
                ) AS "ExistingTicketCounters"
                WHERE "DateKey" GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
                    AND "LastNumber" > 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SupportTicketCounters");
        }
    }
}
