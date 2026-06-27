using API.Configuration;
using API.Data;
using API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace API.Extensions;

public static class DatabaseInitializationExtensions
{
    public static async Task InitialiseDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitialiser");
        var databaseOptions = services.GetRequiredService<IOptions<DatabaseOptions>>().Value;
        var dbContext = services.GetRequiredService<DataContext>();

        if (!databaseOptions.AutoMigrate)
        {
            logger.LogInformation("Automatic database migration is disabled.");
            return;
        }

        logger.LogInformation("Applying database migrations for provider {Provider}.", databaseOptions.Provider);
        await dbContext.Database.MigrateAsync();
        var badgeService = services.GetRequiredService<IBadgeService>();
        await badgeService.SeedDefaultsAsync();
        logger.LogInformation("Database migration completed successfully.");
    }
}
