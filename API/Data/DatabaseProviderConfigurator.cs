using API.Configuration;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace API.Data;

public static class DatabaseProviderConfigurator
{
    public static void Configure(
        DbContextOptionsBuilder options,
        DatabaseOptions databaseOptions,
        string connectionString)
    {
        var migrationsAssembly = databaseOptions.ResolveMigrationsAssembly();

        switch (databaseOptions.NormalizedProvider)
        {
            case DatabaseOptions.PostgresProvider:
                options.UseNpgsql(
                    connectionString,
                    postgresOptions => postgresOptions.MigrationsAssembly(migrationsAssembly));
                break;

            case DatabaseOptions.SqliteProvider:
                options.UseSqlite(
                    connectionString,
                    sqliteOptions => sqliteOptions.MigrationsAssembly(migrationsAssembly));
                break;

            case DatabaseOptions.SqlServerProvider:
                throw new NotSupportedException(
                    "SqlServer provider is reserved for future support. Add the Microsoft.EntityFrameworkCore.SqlServer package and a dedicated migration assembly before enabling it.");

            default:
                throw new InvalidOperationException($"Unsupported database provider '{databaseOptions.Provider}'.");
        }

        options.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    public static string ResolveConnectionString(
        DatabaseOptions databaseOptions,
        string connectionString,
        string basePath)
    {
        if (!DatabaseOptions.IsSqliteProvider(databaseOptions.Provider))
        {
            return connectionString;
        }

        var builder = new SqliteConnectionStringBuilder(connectionString);

        if (!string.IsNullOrWhiteSpace(builder.DataSource) && !Path.IsPathRooted(builder.DataSource))
        {
            builder.DataSource = Path.GetFullPath(Path.Combine(basePath, builder.DataSource));
        }

        return builder.ConnectionString;
    }
}
