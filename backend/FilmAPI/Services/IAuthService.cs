using FilmAPI.DTO;

namespace FilmAPI.Services;

public interface IAuthService
{
    Task<AuthResponseDTO> RegisterAsync(RegisterRequestDTO dto);
    Task<AuthResponseDTO> LoginAsync(LoginRequestDTO dto);
    Task<AuthResponseDTO> RefreshAsync(string refreshToken, string? deviceId);
    Task<bool> LogoutAsync(string refreshToken, string? deviceId);
    Task<UserInfoDTO?> GetUserByIdAsync(int id);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task<string> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<bool> ChangeEmailAsync(int userId, string currentPassword, string newEmail);
}
