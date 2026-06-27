namespace API.Dtos;

public record RegisterDto(
    string Email,
    string Password,
    bool KvkkAccepted,
    bool CommercialElectronicMessages = false,
    string ConsentVersion = "v1");

public record LoginDto(string Email, string Password);

public record RefreshTokenDto(string RefreshToken);

public record ForgotPasswordDto(string Email);

public record ResetPasswordDto(string Email, string Token, string NewPassword);

public record AuthResponseDto(
    string AccessToken,
    int ExpiresIn,
    string RefreshToken,
    string TokenType,
    string Role);
