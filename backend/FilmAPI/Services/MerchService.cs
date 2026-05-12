using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IMerchService
{
    Task<List<MerchItemDTO>> GetItemsAsync();
    Task<MerchOrderDTO> CreateOrderAsync(int userId, MerchOrderCreateDTO dto);
    Task<List<MerchOrderDTO>> GetMyOrdersAsync(int userId);
    Task<List<MerchOrderDTO>> GetAllOrdersAsync();
    Task<MerchOrderDTO?> UpdateOrderStatusAsync(int orderId, string status);
    Task<List<MerchItemDTO>> GetAllItemsAsync();
    Task<MerchItemDTO> CreateItemAsync(MerchItemDTO dto);
    Task<MerchItemDTO?> UpdateItemAsync(int id, MerchItemDTO dto);
    Task<bool> DeleteItemAsync(int id);
}

public class MerchService : IMerchService
{
    private readonly FilmDbContext _db;

    public MerchService(FilmDbContext db)
    {
        _db = db;
    }

    public async Task<List<MerchItemDTO>> GetItemsAsync()
    {
        return await _db.MerchItems
            .Where(m => m.Attivo && m.Stock > 0)
            .OrderBy(m => m.Categoria)
            .ThenBy(m => m.Nome)
            .Select(m => MapItemDTO(m))
            .ToListAsync();
    }

    public async Task<MerchOrderDTO> CreateOrderAsync(int userId, MerchOrderCreateDTO dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            throw new ArgumentException("Il carrello è vuoto.");

        var itemIds = dto.Items.Select(i => i.MerchItemId).Distinct().ToList();
        var merchItems = await _db.MerchItems
            .Where(m => itemIds.Contains(m.Id) && m.Attivo)
            .ToListAsync();

        if (merchItems.Count != itemIds.Count)
            throw new ArgumentException("Uno o più articoli non sono disponibili.");

        var order = new MerchOrder
        {
            UserId = userId,
            Stato = "Pending",
            CodiceOrdine = GeneraCodice(),
            CreatedAtUtc = DateTime.UtcNow
        };

        var orderItems = new List<MerchOrderItem>();
        foreach (var req in dto.Items)
        {
            var item = merchItems.First(m => m.Id == req.MerchItemId);
            if (item.Stock < req.Quantita)
                throw new InvalidOperationException($"Stock insufficiente per '{item.Nome}'. Disponibili: {item.Stock}.");

            item.Stock -= req.Quantita;

            var orderItem = new MerchOrderItem
            {
                MerchOrder = order,
                MerchItemId = item.Id,
                Quantita = req.Quantita,
                PrezzoUnitario = item.Prezzo
            };
            orderItems.Add(orderItem);
        }

        order.Totale = orderItems.Sum(oi => oi.PrezzoUnitario * oi.Quantita);
        order.Items = orderItems;

        _db.MerchOrders.Add(order);
        await _db.SaveChangesAsync();

        return MapOrderDTO(order);
    }

    public async Task<List<MerchOrderDTO>> GetMyOrdersAsync(int userId)
    {
        return await _db.MerchOrders
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Select(o => MapOrderDTO(o))
            .ToListAsync();
    }

    public async Task<List<MerchOrderDTO>> GetAllOrdersAsync()
    {
        return await _db.MerchOrders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Select(o => MapOrderDTO(o))
            .ToListAsync();
    }

    public async Task<MerchOrderDTO?> UpdateOrderStatusAsync(int orderId, string status)
    {
        var validStatuses = new[] { "Pending", "Paid", "Shipped", "Cancelled" };
        if (!validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException($"Stato non valido. Valori ammessi: {string.Join(", ", validStatuses)}.");

        var order = await _db.MerchOrders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return null;

        order.Stato = status;
        await _db.SaveChangesAsync();

        return MapOrderDTO(order);
    }

    public async Task<List<MerchItemDTO>> GetAllItemsAsync()
    {
        return await _db.MerchItems
            .OrderBy(m => m.Categoria)
            .ThenBy(m => m.Nome)
            .Select(m => MapItemDTO(m))
            .ToListAsync();
    }

    public async Task<MerchItemDTO> CreateItemAsync(MerchItemDTO dto)
    {
        var item = new MerchItem
        {
            Nome = dto.Nome,
            Descrizione = dto.Descrizione,
            Prezzo = dto.Prezzo,
            Categoria = dto.Categoria,
            ImmaginePath = dto.ImmaginePath,
            Stock = dto.Stock,
            Attivo = dto.Attivo,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.MerchItems.Add(item);
        await _db.SaveChangesAsync();

        return MapItemDTO(item);
    }

    public async Task<MerchItemDTO?> UpdateItemAsync(int id, MerchItemDTO dto)
    {
        var item = await _db.MerchItems.FindAsync(id);
        if (item == null) return null;

        item.Nome = dto.Nome;
        item.Descrizione = dto.Descrizione;
        item.Prezzo = dto.Prezzo;
        item.Categoria = dto.Categoria;
        item.ImmaginePath = dto.ImmaginePath;
        item.Stock = dto.Stock;
        item.Attivo = dto.Attivo;

        await _db.SaveChangesAsync();
        return MapItemDTO(item);
    }

    public async Task<bool> DeleteItemAsync(int id)
    {
        var item = await _db.MerchItems.FindAsync(id);
        if (item == null) return false;

        _db.MerchItems.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    private static string GeneraCodice()
    {
        var random = new Random();
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var p1 = new string(Enumerable.Range(0, 4).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        var p2 = new string(Enumerable.Range(0, 4).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        return $"MCH-{p1}-{p2}";
    }

    private static MerchItemDTO MapItemDTO(MerchItem m) => new()
    {
        Id = m.Id,
        Nome = m.Nome,
        Descrizione = m.Descrizione,
        Prezzo = m.Prezzo,
        Categoria = m.Categoria,
        ImmaginePath = m.ImmaginePath,
        Stock = m.Stock,
        Attivo = m.Attivo,
        CreatedAtUtc = m.CreatedAtUtc
    };

    private static MerchOrderDTO MapOrderDTO(MerchOrder o) => new()
    {
        Id = o.Id,
        UserId = o.UserId,
        UserEmail = o.User?.Email,
        Totale = o.Totale,
        Stato = o.Stato,
        CodiceOrdine = o.CodiceOrdine,
        CreatedAtUtc = o.CreatedAtUtc,
        Items = o.Items.Select(i => new MerchOrderItemDetailDTO
        {
            Id = i.Id,
            MerchItemId = i.MerchItemId,
            Nome = i.MerchItem?.Nome ?? "",
            ImmaginePath = i.MerchItem?.ImmaginePath,
            Quantita = i.Quantita,
            PrezzoUnitario = i.PrezzoUnitario,
            SubTotale = i.PrezzoUnitario * i.Quantita
        }).ToList()
    };
}
