using API.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace API.UnitTests.Data;

public class AiQuestionGenerationMigrationTests
{
    [Fact]
    public async Task LatestSqliteMigration_CreatesAiTablesWithoutForeignKeyViolations()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<DataContext>()
            .UseSqlite(connection)
            .ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning))
            .Options;
        await using var context = new DataContext(options);

        await context.Database.MigrateAsync();

        var tables = new List<string>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                SELECT name
                FROM sqlite_master
                WHERE type = 'table' AND name LIKE 'AiQuestion%'
                ORDER BY name
                """;
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(reader.GetString(0));
            }
        }

        Assert.Equal(["AiQuestionDrafts", "AiQuestionGenerationJobs"], tables);

        await using var foreignKeyCommand = connection.CreateCommand();
        foreignKeyCommand.CommandText = "PRAGMA foreign_key_check";
        await using var foreignKeyReader = await foreignKeyCommand.ExecuteReaderAsync();
        Assert.False(await foreignKeyReader.ReadAsync());
    }
}
