using API.Configuration;
using API.Data;
using Microsoft.Data.Sqlite;

namespace API.UnitTests.Data;

public class DatabaseProviderConfiguratorTests
{
    [Fact]
    public void ResolveConnectionString_EnforcesConfiguredSqliteTimeout()
    {
        var options = new DatabaseOptions
        {
            Provider = "Sqlite",
            SqliteDefaultTimeoutSeconds = 30
        };

        var result = DatabaseProviderConfigurator.ResolveConnectionString(
            options,
            "Data Source=spk.db;Default Timeout=2",
            Path.GetTempPath());

        var builder = new SqliteConnectionStringBuilder(result);

        Assert.Equal(30, builder.DefaultTimeout);
        Assert.True(Path.IsPathRooted(builder.DataSource));
    }

    [Fact]
    public void ResolveConnectionString_PreservesHigherSqliteTimeout()
    {
        var options = new DatabaseOptions
        {
            Provider = "Sqlite",
            SqliteDefaultTimeoutSeconds = 30
        };

        var result = DatabaseProviderConfigurator.ResolveConnectionString(
            options,
            "Data Source=spk.db;Default Timeout=60",
            Path.GetTempPath());

        var builder = new SqliteConnectionStringBuilder(result);

        Assert.Equal(60, builder.DefaultTimeout);
    }
}
