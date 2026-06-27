using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using API.Dtos;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

public interface ITokenService
{
    Task<AuthResponseDto> CreateTokenResponse(AppUser user);
}

public class TokenService(
    IConfiguration configuration,
    UserManager<AppUser> userManager) : ITokenService
{
    private const int AccessTokenMinutes = 60;
    private const int RefreshTokenDays = 7;

    public async Task<AuthResponseDto> CreateTokenResponse(AppUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var primaryRole = roles.Contains(AppRoles.Admin) ? AppRoles.Admin : AppRoles.Student;
        var expiresAt = DateTime.UtcNow.AddMinutes(AccessTokenMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.DisplayName),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: GetJwtIssuer(),
            audience: GetJwtAudience(),
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        user.RefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays);
        await userManager.UpdateAsync(user);

        return new AuthResponseDto(
            new JwtSecurityTokenHandler().WriteToken(token),
            AccessTokenMinutes * 60,
            user.RefreshToken,
            "Bearer",
            primaryRole);
    }

    private string GetJwtKey()
    {
        return configuration["Jwt:Key"] ??
            throw new InvalidOperationException("Jwt:Key is not configured.");
    }

    private string GetJwtIssuer()
    {
        return configuration["Jwt:Issuer"] ?? "spk-api";
    }

    private string GetJwtAudience()
    {
        return configuration["Jwt:Audience"] ?? "spk-client";
    }
}
