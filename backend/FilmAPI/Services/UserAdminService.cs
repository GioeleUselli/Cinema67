using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public class UserAdminService : IUserAdminService
{
    private readonly FilmDbContext _context;

    public UserAdminService(FilmDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserAdminDTO>> GetAllUsersAsync()
    {
        return await _context.Users
            .Select(u => new UserAdminDTO
            {
                Id = u.Id,
                Email = u.Email,
                Nome = u.Nome,
                Cognome = u.Cognome,
                Telefono = u.Telefono,
                Ruolo = u.Ruolo.ToString(),
                DataRegistrazione = u.DataRegistrazione
            })
            .ToListAsync();
    }

    public async Task<UserAdminDTO?> UpdateUserRoleAsync(int userId, UpdateRuoloDTO dto, int requestingUserId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null) return null;

        if (!Enum.TryParse<UserRole>(dto.NuovoRuolo, out var newRole))
        {
            throw new InvalidOperationException("Ruolo non valido");
        }

        if (user.Ruolo == UserRole.Admin && newRole != UserRole.Admin)
        {
            var adminCount = await _context.Users.CountAsync(u => u.Ruolo == UserRole.Admin);
            if (adminCount <= 1)
            {
                throw new InvalidOperationException("Non e possibile degradare l'ultimo admin");
            }
        }

        user.Ruolo = newRole;
        await _context.SaveChangesAsync();

        return new UserAdminDTO
        {
            Id = user.Id,
            Email = user.Email,
            Nome = user.Nome,
            Cognome = user.Cognome,
            Telefono = user.Telefono,
            Ruolo = user.Ruolo.ToString(),
            DataRegistrazione = user.DataRegistrazione
        };
    }
}
