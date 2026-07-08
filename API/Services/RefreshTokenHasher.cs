using System.Security.Cryptography;
using System.Text;

namespace API.Services;

public static class RefreshTokenHasher
{
    public static string Hash(string refreshToken)
    {
        var bytes = Encoding.UTF8.GetBytes(refreshToken);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}
