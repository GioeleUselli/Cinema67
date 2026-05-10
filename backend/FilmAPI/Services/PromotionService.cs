using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IPromotionService
{
    Task<List<PromotionDTO>> GetAllAsync(bool? activeOnly);
    Task<List<PromotionDTO>> GetActiveAsync();
    Task<PromotionDTO?> GetByIdAsync(int id);
    Task<PromotionDTO> CreateAsync(PromotionCreateDTO dto);
    Task<PromotionDTO?> UpdateAsync(int id, PromotionUpdateDTO dto);
    Task<bool> DeleteAsync(int id);
    Task<PromotionDTO> ClaimPromotionAsync(int id);
}

public class PromotionService : IPromotionService
{
    private readonly FilmDbContext _db;

    public PromotionService(FilmDbContext db) { _db = db; }

    public async Task<List<PromotionDTO>> GetAllAsync(bool? activeOnly)
    {
        var query = _db.Promotions.AsQueryable();
        if (activeOnly == true)
            query = query.Where(p => p.Active && (p.StartDate == null || p.StartDate <= DateTime.UtcNow) && (p.EndDate == null || p.EndDate >= DateTime.UtcNow));
        return await query.OrderByDescending(p => p.Priority).ThenByDescending(p => p.CreatedAtUtc)
            .Select(p => Map(p)).ToListAsync();
    }

    public async Task<List<PromotionDTO>> GetActiveAsync()
    {
        var now = DateTime.UtcNow;
        return await _db.Promotions
            .Where(p => p.Active && (p.StartDate == null || p.StartDate <= now) && (p.EndDate == null || p.EndDate >= now))
            .OrderByDescending(p => p.Priority)
            .Take(12)
            .Select(p => Map(p)).ToListAsync();
    }

    public async Task<PromotionDTO?> GetByIdAsync(int id)
    {
        var p = await _db.Promotions.FindAsync(id);
        return p is null ? null : Map(p);
    }

    public async Task<PromotionDTO> CreateAsync(PromotionCreateDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title)) throw new ArgumentException("Titolo obbligatorio.");
        if (!Enum.TryParse<PromotionType>(dto.Type, true, out var type)) throw new ArgumentException("Tipo promozione non valido.");

        var p = new Promotion
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            ImagePath = string.IsNullOrWhiteSpace(dto.ImagePath) ? null : dto.ImagePath.Trim(),
            LinkUrl = string.IsNullOrWhiteSpace(dto.LinkUrl) ? null : dto.LinkUrl.Trim(),
            Type = type,
            Price = dto.Price,
            DiscountPercent = dto.DiscountPercent,
            DiscountCode = string.IsNullOrWhiteSpace(dto.DiscountCode) ? null : dto.DiscountCode.Trim().ToUpper(),
            MaxUsage = dto.MaxUsage,
            Active = dto.Active,
            Priority = dto.Priority,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };
        _db.Promotions.Add(p);
        await _db.SaveChangesAsync();
        return Map(p);
    }

    public async Task<PromotionDTO?> UpdateAsync(int id, PromotionUpdateDTO dto)
    {
        var p = await _db.Promotions.FindAsync(id);
        if (p is null) return null;

        if (dto.Title != null) p.Title = dto.Title.Trim();
        if (dto.Description != null) p.Description = dto.Description.Trim();
        if (dto.ImagePath != null) p.ImagePath = dto.ImagePath.Trim();
        if (dto.LinkUrl != null) p.LinkUrl = dto.LinkUrl.Trim();
        if (dto.Type != null && Enum.TryParse<PromotionType>(dto.Type, true, out var type)) p.Type = type;
        if (dto.Price.HasValue) p.Price = dto.Price;
        if (dto.DiscountPercent.HasValue) p.DiscountPercent = dto.DiscountPercent;
        if (dto.DiscountCode != null) p.DiscountCode = dto.DiscountCode.Trim().ToUpper();
        if (dto.MaxUsage.HasValue) p.MaxUsage = dto.MaxUsage;
        if (dto.Active.HasValue) p.Active = dto.Active.Value;
        if (dto.Priority.HasValue) p.Priority = dto.Priority.Value;
        if (dto.StartDate != null) p.StartDate = dto.StartDate;
        if (dto.EndDate != null) p.EndDate = dto.EndDate;
        p.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Map(p);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var p = await _db.Promotions.FindAsync(id);
        if (p is null) return false;
        _db.Promotions.Remove(p);
        await _db.SaveChangesAsync();
        return true;
    }

    private static PromotionDTO Map(Promotion p) => new()
    {
        Id = p.Id, Title = p.Title, Description = p.Description,
        ImagePath = p.ImagePath, LinkUrl = p.LinkUrl, Type = p.Type.ToString(),
        Price = p.Price, DiscountPercent = p.DiscountPercent,
        DiscountCode = p.DiscountCode, MaxUsage = p.MaxUsage,
        UsageCount = p.UsageCount, Active = p.Active, Priority = p.Priority,
        StartDate = p.StartDate, EndDate = p.EndDate,
        CreatedAtUtc = p.CreatedAtUtc, UpdatedAtUtc = p.UpdatedAtUtc
    };

    public async Task<PromotionDTO> ClaimPromotionAsync(int id)
    {
        var p = await _db.Promotions.FindAsync(id)
            ?? throw new ArgumentException("Promozione non trovata.");

        if (!p.Active)
            throw new InvalidOperationException("Promozione non attiva.");

        if (p.StartDate.HasValue && p.StartDate > DateTime.UtcNow)
            throw new InvalidOperationException("Promozione non ancora iniziata.");

        if (p.EndDate.HasValue && p.EndDate < DateTime.UtcNow)
            throw new InvalidOperationException("Promozione scaduta.");

        if (p.MaxUsage.HasValue && p.UsageCount >= p.MaxUsage.Value)
            throw new InvalidOperationException("Promozione esaurita.");

        p.UsageCount++;
        await _db.SaveChangesAsync();
        return Map(p);
    }
}
