using API.Configuration;
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
        databaseOptions.Provider = GetArgumentValue(args, "provider")
            ?? Environment.GetEnvironmentVariable("EF_PROVIDER")
            ?? databaseOptions.Provider;

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=spk.db";
        connectionString = GetArgumentValue(args, "connection")
            ?? Environment.GetEnvironmentVariable("EF_CONNECTION")
            ?? connectionString;
        connectionString = DatabaseProviderConfigurator.ResolveConnectionString(databaseOptions, connectionString, basePath);

        var optionsBuilder = new DbContextOptionsBuilder<DataContext>();
        DatabaseProviderConfigurator.Configure(optionsBuilder, databaseOptions, connectionString);
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

    private static string? GetArgumentValue(string[] args, string name)
    {
        var prefixedName = "--" + name;

        for (var i = 0; i < args.Length; i++)
        {
            var argument = args[i];

            if (argument.Equals(prefixedName, StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                return args[i + 1];
            }

            if (argument.StartsWith(prefixedName + "=", StringComparison.OrdinalIgnoreCase))
            {
                return argument[(prefixedName.Length + 1)..];
            }
        }

        return null;
    }
}
