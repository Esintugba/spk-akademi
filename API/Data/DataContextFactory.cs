using API.Configuration;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace API.Data;

public sealed class DataContextFactory : IDesignTimeDbContextFactory<DataContext>
{
    public DataContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var basePath = ResolveProjectPath();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var databaseOptions = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>()
            ?? new DatabaseOptions();
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=spk.db";

        var optionsBuilder = new DbContextOptionsBuilder<DataContext>();
        var provider = databaseOptions.Provider.Trim().ToLowerInvariant();

        if (provider is "postgres" or "postgresql" or "npgsql")
        {
            optionsBuilder.UseNpgsql(connectionString);
            return new DataContext(optionsBuilder.Options);
        }

        optionsBuilder.UseSqlite(ResolveSqliteConnectionString(connectionString, basePath));
        return new DataContext(optionsBuilder.Options);
    }

    private static string ResolveProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();

        if (File.Exists(Path.Combine(currentDirectory, "API.csproj")))
        {
            return currentDirectory;
        }

        var apiDirectory = Path.Combine(currentDirectory, "API");
        return File.Exists(Path.Combine(apiDirectory, "API.csproj"))
            ? apiDirectory
            : currentDirectory;
    }

    private static string ResolveSqliteConnectionString(string connectionString, string basePath)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);

        if (!string.IsNullOrWhiteSpace(builder.DataSource) && !Path.IsPathRooted(builder.DataSource))
        {
            builder.DataSource = Path.GetFullPath(Path.Combine(basePath, builder.DataSource));
        }

        return builder.ConnectionString;
    }
}
