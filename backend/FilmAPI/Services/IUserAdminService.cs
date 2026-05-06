using FilmAPI.DTO;
using FilmAPI.Model;

namespace FilmAPI.Services;

public interface IUserAdminService
{
    Task<List<UserAdminDTO>> GetAllUsersAsync();
    Task<UserAdminDTO?> UpdateUserRoleAsync(int userId, UpdateRuoloDTO dto, int requestingUserId);
    Task<UserAdminDTO> CreateUserAsync(CreateUserDTO dto);
    Task<UserAdminDTO?> UpdateUserCinemaAsync(int userId, int? cinemaId);
}
