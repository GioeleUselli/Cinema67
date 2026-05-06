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

    public async Task<UserAdminDTO> CreateUserAsync(CreateUserDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new ArgumentException("Email obbligatoria.");
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            throw new ArgumentException("Password minima 8 caratteri.");
        if (!Enum.TryParse<UserRole>(dto.Ruolo, out var role))
            throw new ArgumentException("Ruolo non valido.");

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
            throw new InvalidOperationException("Email già registrata.");

        if (dto.CinemaId.HasValue)
        {
            var cinemaExists = await _context.Cinemas.AnyAsync(c => c.Id == dto.CinemaId.Value);
            if (!cinemaExists) throw new ArgumentException("Cinema non trovato.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Nome = dto.Nome.Trim(),
            Cognome = dto.Cognome.Trim(),
            Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : dto.Telefono.Trim(),
            Ruolo = role,
            CinemaPreferitoId = dto.CinemaId,
            CreditoResiduo = 0,
            DataRegistrazione = DateTime.UtcNow
        };

        _context.Users.Add(user);
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

    public async Task<UserAdminDTO?> UpdateUserCinemaAsync(int userId, int? cinemaId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null) return null;

        if (cinemaId.HasValue)
        {
            var exists = await _context.Cinemas.AnyAsync(c => c.Id == cinemaId.Value);
            if (!exists) throw new ArgumentException("Cinema non trovato.");
        }

        user.CinemaPreferitoId = cinemaId;
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
