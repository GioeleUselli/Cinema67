using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public interface IFoodService
{
    Task<FoodMenuDTO> GetMenuAsync();
    Task<List<FoodOrderItemDetailDTO>> AddFoodToOrderAsync(int ordineId, int userId, FoodOrderRequestDTO dto);
    Task<List<FoodOrderItemDetailDTO>> GetOrderFoodAsync(int ordineId, int userId);
    Task<List<FoodItemDTO>> GetAllFoodItemsAsync();
    Task<FoodItemDTO> CreateFoodItemAsync(FoodItemDTO dto);
    Task<FoodItemDTO?> UpdateFoodItemAsync(int id, FoodItemDTO dto);
    Task<bool> DeleteFoodItemAsync(int id);
    Task<object?> GetReceiptByCodeAsync(string code);
    Task<bool> MarkServedAsync(int itemId);
}

public class FoodService : IFoodService
{
    private readonly FilmDbContext _db;

    public FoodService(FilmDbContext db)
    {
        _db = db;
    }

    public async Task<FoodMenuDTO> GetMenuAsync()
    {
        var items = await _db.FoodItems
            .Where(f => f.Attivo)
            .OrderBy(f => f.Nome)
            .ToListAsync();

        return new FoodMenuDTO
        {
            Popcorn = items.Where(f => f.Categoria == "Popcorn").Select(Map).ToList(),
            Bevande = items.Where(f => f.Categoria == "Bevande").Select(Map).ToList(),
            Snack = items.Where(f => f.Categoria == "Snack").Select(Map).ToList(),
            Dolci = items.Where(f => f.Categoria == "Dolci").Select(Map).ToList()
        };
    }

    public async Task<List<FoodOrderItemDetailDTO>> AddFoodToOrderAsync(int ordineId, int userId, FoodOrderRequestDTO dto)
    {
        var ordine = await _db.Ordini
            .FirstOrDefaultAsync(o => o.Id == ordineId && o.UserId == userId);

        if (ordine == null)
            throw new KeyNotFoundException("Ordine non trovato.");

        if (ordine.Stato != OrdineState.Pending)
            throw new InvalidOperationException("È possibile aggiungere cibo solo a ordini in attesa di pagamento.");

        var foodItemIds = dto.Items.Select(i => i.FoodItemId).Distinct().ToList();
        var foodItems = await _db.FoodItems
            .Where(f => foodItemIds.Contains(f.Id) && f.Attivo)
            .ToDictionaryAsync(f => f.Id);

        if (foodItems.Count != foodItemIds.Count)
            throw new ArgumentException("Uno o più prodotti non sono disponibili.");

        var existingItems = await _db.FoodOrderItems
            .Where(foi => foi.OrdineId == ordineId)
            .ToListAsync();

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.Quantita <= 0)
                continue;

            var existing = existingItems.FirstOrDefault(e => e.FoodItemId == itemDto.FoodItemId);
            if (existing != null)
            {
                existing.Quantita += itemDto.Quantita;
            }
            else
            {
                var foodItem = foodItems[itemDto.FoodItemId];
                _db.FoodOrderItems.Add(new FoodOrderItem
                {
                    OrdineId = ordineId,
                    FoodItemId = itemDto.FoodItemId,
                    Quantita = itemDto.Quantita,
                    PrezzoUnitario = itemDto.PrezzoUnitario ?? foodItem.Prezzo
                });
            }
        }

        await _db.SaveChangesAsync();

        var allOrderItems = await _db.FoodOrderItems
            .Include(foi => foi.FoodItem)
            .Where(foi => foi.OrdineId == ordineId)
            .ToListAsync();

        var foodTotal = allOrderItems.Sum(foi => foi.PrezzoUnitario * foi.Quantita);

        ordine.TotaleLordo += foodTotal;
        ordine.ImportoCarta += foodTotal;

        await _db.SaveChangesAsync();

        return allOrderItems.Select(MapToDetail).ToList();
    }

    public async Task<List<FoodOrderItemDetailDTO>> GetOrderFoodAsync(int ordineId, int userId)
    {
        var ordine = await _db.Ordini
            .FirstOrDefaultAsync(o => o.Id == ordineId && o.UserId == userId);

        if (ordine == null)
            throw new KeyNotFoundException("Ordine non trovato.");

        var items = await _db.FoodOrderItems
            .Include(foi => foi.FoodItem)
            .Where(foi => foi.OrdineId == ordineId)
            .ToListAsync();

        return items.Select(MapToDetail).ToList();
    }

    public async Task<List<FoodItemDTO>> GetAllFoodItemsAsync()
    {
        return await _db.FoodItems
            .OrderBy(f => f.Categoria)
            .ThenBy(f => f.Nome)
            .Select(f => new FoodItemDTO
            {
                Id = f.Id,
                Nome = f.Nome,
                Descrizione = f.Descrizione,
                Prezzo = f.Prezzo,
                Categoria = f.Categoria,
                ImmaginePath = f.ImmaginePath,
                Attivo = f.Attivo
            })
            .ToListAsync();
    }

    public async Task<FoodItemDTO> CreateFoodItemAsync(FoodItemDTO dto)
    {
        var foodItem = new FoodItem
        {
            Nome = dto.Nome,
            Descrizione = dto.Descrizione,
            Prezzo = dto.Prezzo,
            Categoria = dto.Categoria,
            ImmaginePath = dto.ImmaginePath,
            Attivo = dto.Attivo,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.FoodItems.Add(foodItem);
        await _db.SaveChangesAsync();

        return Map(foodItem);
    }

    public async Task<FoodItemDTO?> UpdateFoodItemAsync(int id, FoodItemDTO dto)
    {
        var foodItem = await _db.FoodItems.FindAsync(id);
        if (foodItem == null)
            return null;

        foodItem.Nome = dto.Nome;
        foodItem.Descrizione = dto.Descrizione;
        foodItem.Prezzo = dto.Prezzo;
        foodItem.Categoria = dto.Categoria;
        foodItem.ImmaginePath = dto.ImmaginePath;
        foodItem.Attivo = dto.Attivo;

        await _db.SaveChangesAsync();
        return Map(foodItem);
    }

    public async Task<bool> DeleteFoodItemAsync(int id)
    {
        var foodItem = await _db.FoodItems.FindAsync(id);
        if (foodItem == null)
            return false;

        _db.FoodItems.Remove(foodItem);
        await _db.SaveChangesAsync();
        return true;
    }

    private static FoodItemDTO Map(FoodItem f) => new()
    {
        Id = f.Id,
        Nome = f.Nome,
        Descrizione = f.Descrizione,
        Prezzo = f.Prezzo,
        Categoria = f.Categoria,
        ImmaginePath = f.ImmaginePath,
        Attivo = f.Attivo
    };

    private static FoodOrderItemDetailDTO MapToDetail(FoodOrderItem foi) => new()
    {
        Id = foi.Id,
        FoodItemId = foi.FoodItemId,
        Nome = foi.FoodItem?.Nome ?? "",
        Descrizione = foi.FoodItem?.Descrizione,
        Categoria = foi.FoodItem?.Categoria ?? "",
        Quantita = foi.Quantita,
        PrezzoUnitario = foi.PrezzoUnitario,
        SubTotale = foi.PrezzoUnitario * foi.Quantita,
        Servito = foi.Servito
    };

    public async Task<object?> GetReceiptByCodeAsync(string code)
    {
        var parts = code.Split('-');
        if (parts.Length < 3 || !int.TryParse(parts[2], out var orderId)) return null;

        var ordine = await _db.Ordini
            .Include(o => o.FoodOrderItems).ThenInclude(f => f.FoodItem)
            .Include(o => o.Show!).ThenInclude(s => s!.Film)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (ordine is null || ordine.FoodOrderItems.Count == 0) return null;

        return new
        {
            ordineId = ordine.Id,
            codiceOrdine = ordine.CodiceOrdine,
            film = ordine.Show?.Film?.Titolo ?? "",
            items = ordine.FoodOrderItems.Select(f => new FoodOrderItemDetailDTO
            {
                Id = f.Id, FoodItemId = f.FoodItemId,
                Nome = f.FoodItem?.Nome ?? "",
                Categoria = f.FoodItem?.Categoria ?? "",
                Quantita = f.Quantita, PrezzoUnitario = f.PrezzoUnitario,
                SubTotale = f.PrezzoUnitario * f.Quantita,
                Servito = f.Servito
            }).ToList(),
            foodTotal = ordine.FoodOrderItems.Sum(f => f.PrezzoUnitario * f.Quantita),
            allServed = ordine.FoodOrderItems.All(f => f.Servito)
        };
    }

    public async Task<bool> MarkServedAsync(int itemId)
    {
        var item = await _db.FoodOrderItems.FindAsync(itemId);
        if (item is null) return false;
        item.Servito = true;
        await _db.SaveChangesAsync();
        return true;
    }
}
