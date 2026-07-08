using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using API.Configuration;
using API.Dtos;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

public interface ITokenService
{
    Task<AuthResponseDto> CreateTokenResponse(AppUser user);
}

public class TokenService(
    IOptions<JwtOptions> jwtOptions,
    UserManager<AppUser> userManager) : ITokenService
{
    public async Task<AuthResponseDto> CreateTokenResponse(AppUser user)
    {
        var options = jwtOptions.Value;
        var roles = await userManager.GetRolesAsync(user);
        var primaryRole = roles.Contains(AppRoles.Admin) ? AppRoles.Admin : AppRoles.Student;
        var expiresAt = DateTime.UtcNow.AddMinutes(options.AccessTokenMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey(options)));
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
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(options.RefreshTokenDays);
        user.RefreshToken = RefreshTokenHasher.Hash(refreshToken);
        user.RefreshTokenExpiresAt = refreshTokenExpiresAt;
        await userManager.UpdateAsync(user);

        return new AuthResponseDto(
            new JwtSecurityTokenHandler().WriteToken(token),
            options.AccessTokenMinutes * 60,
            refreshToken,
            "Bearer",
            primaryRole,
            refreshTokenExpiresAt,
            user.Email ?? string.Empty);
    }

    private static string GetJwtKey(JwtOptions options)
    {
        return !string.IsNullOrWhiteSpace(options.Key)
            ? options.Key.Trim()
            : throw new InvalidOperationException("Jwt:Key is not configured.");
    }
}
