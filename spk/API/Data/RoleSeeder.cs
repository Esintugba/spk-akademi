using API.Configuration;
using API.Entities;
using API.Services;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Identity;

namespace API.Data;

public static class RoleSeeder
{
    public static async Task SeedRoles(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var seedAdminOptions = scope.ServiceProvider.GetRequiredService<IOptions<SeedAdminOptions>>().Value;

        foreach (var role in new[] { AppRoles.Admin, AppRoles.Student })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var users = userManager.Users.OrderBy(x => x.Email).ToList();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);

            if (roles.Count == 0)
            {
                await userManager.AddToRoleAsync(user, AppRoles.Student);
            }
        }

        if (!seedAdminOptions.Enabled)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(seedAdminOptions.Email) ||
            string.IsNullOrWhiteSpace(seedAdminOptions.Password))
        {
            throw new InvalidOperationException("Seed admin etkin, ancak SeedAdmin:Email veya SeedAdmin:Password yapılandırılmamış.");
        }

        if (!app.Environment.IsDevelopment() &&
            ConfigurationSecurityValidator.ContainsPlaceholder(seedAdminOptions.Password))
        {
            throw new InvalidOperationException("Production/Staging ortamında placeholder seed admin şifresi kullanılamaz.");
        }

        var adminUser = await userManager.FindByEmailAsync(seedAdminOptions.Email);

        if (adminUser is null)
        {
            adminUser = new AppUser
            {
                Email = seedAdminOptions.Email,
                UserName = seedAdminOptions.Email,
                DisplayName = seedAdminOptions.DisplayName
            };

            var createResult = await userManager.CreateAsync(adminUser, seedAdminOptions.Password);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException($"Seed admin kullanıcısı oluşturulamadı: {string.Join(" ", createResult.Errors.Select(x => x.Description))}");
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, AppRoles.Admin))
        {
            await userManager.AddToRoleAsync(adminUser, AppRoles.Admin);
        }
    }

}
