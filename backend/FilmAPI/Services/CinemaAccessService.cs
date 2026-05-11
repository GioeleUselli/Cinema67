using FilmAPI.Data;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface ICinemaAccessService
{
    Task<bool> CanValidateTicketsAsync(int userId, int cinemaId);
    Task<bool> CanTopUpCreditAsync(int userId, int cinemaId);
    Task<bool> CanManageShowsAsync(int userId, int cinemaId);
    Task<List<UserCinemaAssignment>> GetAssignmentsAsync(int userId);
    Task<UserCinemaAssignment> AddAssignmentAsync(int userId, int cinemaId, int createdByUserId);
    Task UpdateAssignmentAsync(int assignmentId, bool canValidate, bool canTopUp, bool canManage, bool isActive);
    Task RevokeAssignmentAsync(int assignmentId, int revokedByUserId);
}

public class CinemaAccessService : ICinemaAccessService
{
    private readonly FilmDbContext _db;

    public CinemaAccessService(FilmDbContext db)
    {
        _db = db;
    }

    public async Task<bool> CanValidateTicketsAsync(int userId, int cinemaId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return false;
        if (user.Ruolo == UserRole.Admin || user.Ruolo == UserRole.PowerUser) return true;
        if (user.Ruolo != UserRole.CinemaStaff) return false;
        return await _db.UserCinemaAssignments.AnyAsync(a =>
            a.UserId == userId && a.CinemaId == cinemaId && a.IsActive && a.CanValidateTickets);
    }

    public async Task<bool> CanTopUpCreditAsync(int userId, int cinemaId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return false;
        if (user.Ruolo == UserRole.Admin || user.Ruolo == UserRole.PowerUser) return true;
        if (user.Ruolo != UserRole.CinemaStaff) return false;
        return await _db.UserCinemaAssignments.AnyAsync(a =>
            a.UserId == userId && a.CinemaId == cinemaId && a.IsActive && a.CanTopUpCredit);
    }

    public async Task<bool> CanManageShowsAsync(int userId, int cinemaId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return false;
        if (user.Ruolo == UserRole.Admin || user.Ruolo == UserRole.PowerUser) return true;
        if (user.Ruolo != UserRole.CinemaStaff) return false;
        return await _db.UserCinemaAssignments.AnyAsync(a =>
            a.UserId == userId && a.CinemaId == cinemaId && a.IsActive && a.CanManageShows);
    }

    public async Task<List<UserCinemaAssignment>> GetAssignmentsAsync(int userId)
    {
        return await _db.UserCinemaAssignments
            .Where(a => a.UserId == userId)
            .Include(a => a.Cinema)
            .ToListAsync();
    }

    public async Task<UserCinemaAssignment> AddAssignmentAsync(int userId, int cinemaId, int createdByUserId)
    {
        var assignment = new UserCinemaAssignment
        {
            UserId = userId,
            CinemaId = cinemaId,
            CreatedByUserId = createdByUserId,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.UserCinemaAssignments.Add(assignment);
        await _db.SaveChangesAsync();
        return assignment;
    }

    public async Task UpdateAssignmentAsync(int assignmentId, bool canValidate, bool canTopUp, bool canManage, bool isActive)
    {
        var assignment = await _db.UserCinemaAssignments.FindAsync(assignmentId);
        if (assignment == null) throw new InvalidOperationException("Assignment not found.");
        assignment.CanValidateTickets = canValidate;
        assignment.CanTopUpCredit = canTopUp;
        assignment.CanManageShows = canManage;
        assignment.IsActive = isActive;
        assignment.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task RevokeAssignmentAsync(int assignmentId, int revokedByUserId)
    {
        var assignment = await _db.UserCinemaAssignments.FindAsync(assignmentId);
        if (assignment == null) throw new InvalidOperationException("Assignment not found.");
        assignment.IsActive = false;
        assignment.RevokedAtUtc = DateTime.UtcNow;
        assignment.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
