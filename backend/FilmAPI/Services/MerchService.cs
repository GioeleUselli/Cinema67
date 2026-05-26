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
    Task<MerchItemDTO?> GetItemByIdAsync(int id);
    Task<MerchItemDTO> CreateItemAsync(MerchItemDTO dto);
    Task<MerchItemDTO?> UpdateItemAsync(int id, MerchItemDTO dto);
    Task<bool> DeleteItemAsync(int id);
    Task<MerchItemVariantDTO> AddVariantAsync(int itemId, MerchItemVariantDTO dto);
    Task<MerchItemVariantDTO?> UpdateVariantAsync(int variantId, MerchItemVariantDTO dto);
    Task<bool> DeleteVariantAsync(int variantId);
    Task<string> UploadItemImageAsync(int itemId, string path);
    Task<bool> DeleteItemImageAsync(int imageId);
}

public class MerchService : IMerchService
{
    private readonly FilmDbContext _db;
    private readonly IShippingService _shipping;

    public MerchService(FilmDbContext db, IShippingService shipping)
    {
        _db = db; _shipping = shipping;
    }

    private IQueryable<MerchItem> ItemsWithIncludes =>
        _db.MerchItems.Include(m => m.Immagini).Include(m => m.Varianti);

    public async Task<List<MerchItemDTO>> GetItemsAsync()
    {
        var items = await ItemsWithIncludes
            .Where(m => m.Attivo && m.Stock > 0)
            .OrderBy(m => m.Categoria)
            .ThenBy(m => m.Nome)
            .ToListAsync();
        return items.Select(MapItemDTO).ToList();
    }

    public async Task<List<MerchItemDTO>> GetAllItemsAsync()
    {
        var items = await ItemsWithIncludes
            .OrderBy(m => m.Categoria)
            .ThenBy(m => m.Nome)
            .ToListAsync();
        return items.Select(MapItemDTO).ToList();
    }

    public async Task<MerchItemDTO?> GetItemByIdAsync(int id)
    {
        var item = await ItemsWithIncludes.FirstOrDefaultAsync(m => m.Id == id);
        return item is null ? null : MapItemDTO(item);
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

        decimal totale = 0;
        var orderItems = new List<MerchOrderItem>();
        foreach (var req in dto.Items)
        {
            var merch = merchItems.First(m => m.Id == req.MerchItemId);
            decimal prezzo = merch.Prezzo;
            if (req.VariantId.HasValue)
            {
                var variant = await _db.MerchItemVariants.FindAsync(req.VariantId.Value);
                if (variant != null && variant.MerchItemId == req.MerchItemId && variant.Prezzo.HasValue)
                    prezzo = variant.Prezzo.Value;
            }
            var sub = prezzo * req.Quantita;
            totale += sub;
            orderItems.Add(new MerchOrderItem
            {
                MerchItemId = req.MerchItemId,
                Quantita = req.Quantita,
                PrezzoUnitario = prezzo
            });
        }

        decimal scontoPercent = 0;
        if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
        {
            var discount = await _db.MerchDiscountCodes
                .FirstOrDefaultAsync(d => d.Codice == dto.DiscountCode.Trim().ToUpper() && d.Attivo
                    && (!d.ScadeIl.HasValue || d.ScadeIl.Value > DateTime.UtcNow)
                    && d.Utilizzi < d.MaxUtilizzi);
            if (discount != null)
            {
                scontoPercent = discount.PercentualeSconto;
                discount.Utilizzi++;
            }
        }

        decimal sconto = 0;
        if (scontoPercent > 0)
        {
            sconto = Math.Round(totale * scontoPercent / 100m, 2);
        }
        else if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
        {
            var discountFisso = await _db.MerchDiscountCodes
                .FirstOrDefaultAsync(d => d.Codice == dto.DiscountCode.Trim().ToUpper() && d.Attivo
                    && (!d.ScadeIl.HasValue || d.ScadeIl.Value > DateTime.UtcNow)
                    && d.Utilizzi < d.MaxUtilizzi);
            if (discountFisso != null && discountFisso.ValoreScontoFisso > 0)
            {
                sconto = Math.Min(discountFisso.ValoreScontoFisso, totale);
                discountFisso.Utilizzi++;
            }
        }
        totale -= sconto;

        var costoShip = _shipping.CalcolaCostoSpedizione(dto.TipoConsegna ?? "RitiroCinema", dto.CinemaRitiroId, dto.CAP);
        if (costoShip > 0) totale += costoShip;
        var (_, _, dataPrevista) = _shipping.CalcolaSpedizioneCompleta(dto.TipoConsegna ?? "RitiroCinema", dto.CinemaRitiroId, dto.CAP);

        var order = new MerchOrder
        {
            UserId = userId,
            Stato = "Pending",
            CodiceOrdine = GeneraCodice(),
            Totale = totale,
            Items = orderItems,
            CostoSpedizione = costoShip,
            DataConsegnaPrevista = dataPrevista,
            TipoConsegna = dto.TipoConsegna ?? "RitiroCinema",
            Indirizzo = dto.Indirizzo?.Trim(),
            Citta = dto.Citta?.Trim(),
            CAP = dto.CAP?.Trim(),
            Provincia = dto.Provincia?.Trim(),
            Telefono = dto.Telefono?.Trim(),
            CinemaRitiroId = dto.CinemaRitiroId,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.MerchOrders.Add(order);
        await _db.SaveChangesAsync();

        order = await _db.MerchOrders
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .Include(o => o.CinemaRitiro)
            .FirstAsync(o => o.Id == order.Id);

        return MapOrderDTO(order);
    }

    public async Task<List<MerchOrderDTO>> GetMyOrdersAsync(int userId)
    {
        var orders = await _db.MerchOrders
            .Where(o => o.UserId == userId)
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .Include(o => o.CinemaRitiro)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync();
        return orders.Select(MapOrderDTO).ToList();
    }

    public async Task<List<MerchOrderDTO>> GetAllOrdersAsync()
    {
        var orders = await _db.MerchOrders
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync();
        return orders.Select(MapOrderDTO).ToList();
    }

    public async Task<MerchOrderDTO?> UpdateOrderStatusAsync(int orderId, string status)
    {
        var order = await _db.MerchOrders
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return null;
        order.Stato = status;
        await _db.SaveChangesAsync();
        return MapOrderDTO(order);
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

        if (dto.Immagini.Count > 0)
        {
            foreach (var img in dto.Immagini)
                item.Immagini.Add(new MerchItemImage { Path = img, Ordine = item.Immagini.Count });
        }

        if (dto.Varianti.Count > 0)
        {
            foreach (var v in dto.Varianti)
                item.Varianti.Add(new MerchItemVariant { Colore = v.Colore, Taglia = v.Taglia, Stock = v.Stock, Prezzo = v.Prezzo });
        }

        _db.MerchItems.Add(item);
        await _db.SaveChangesAsync();

        return MapItemDTO(item);
    }

    public async Task<MerchItemDTO?> UpdateItemAsync(int id, MerchItemDTO dto)
    {
        var item = await ItemsWithIncludes.FirstOrDefaultAsync(m => m.Id == id);
        if (item == null) return null;

        item.Nome = dto.Nome;
        item.Descrizione = dto.Descrizione;
        item.Prezzo = dto.Prezzo;
        item.Categoria = dto.Categoria;
        item.ImmaginePath = dto.ImmaginePath;
        item.Stock = dto.Stock;
        item.Attivo = dto.Attivo;

        if (dto.Immagini.Count > 0)
        {
            _db.MerchItemImages.RemoveRange(item.Immagini);
            item.Immagini.Clear();
            int ord = 0;
            foreach (var img in dto.Immagini)
                item.Immagini.Add(new MerchItemImage { Path = img, Ordine = ord++ });
        }

        if (dto.Varianti.Count > 0)
        {
            _db.MerchItemVariants.RemoveRange(item.Varianti);
            item.Varianti.Clear();
            foreach (var v in dto.Varianti)
                item.Varianti.Add(new MerchItemVariant { Colore = v.Colore, Taglia = v.Taglia, Stock = v.Stock, Prezzo = v.Prezzo });
        }

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

    public async Task<MerchItemVariantDTO> AddVariantAsync(int itemId, MerchItemVariantDTO dto)
    {
        var variant = new MerchItemVariant
        {
            MerchItemId = itemId,
            Colore = dto.Colore,
            Taglia = dto.Taglia,
            Stock = dto.Stock,
            Prezzo = dto.Prezzo
        };
        _db.MerchItemVariants.Add(variant);
        await _db.SaveChangesAsync();
        dto.Id = variant.Id;
        dto.MerchItemId = variant.MerchItemId;
        return dto;
    }

    public async Task<MerchItemVariantDTO?> UpdateVariantAsync(int variantId, MerchItemVariantDTO dto)
    {
        var v = await _db.MerchItemVariants.FindAsync(variantId);
        if (v == null) return null;
        v.Colore = dto.Colore;
        v.Taglia = dto.Taglia;
        v.Stock = dto.Stock;
        v.Prezzo = dto.Prezzo;
        await _db.SaveChangesAsync();
        dto.Id = v.Id;
        dto.MerchItemId = v.MerchItemId;
        return dto;
    }

    public async Task<bool> DeleteVariantAsync(int variantId)
    {
        var v = await _db.MerchItemVariants.FindAsync(variantId);
        if (v == null) return false;
        _db.MerchItemVariants.Remove(v);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<string> UploadItemImageAsync(int itemId, string path)
    {
        var item = await _db.MerchItems.Include(m => m.Immagini).FirstOrDefaultAsync(m => m.Id == itemId)
            ?? throw new ArgumentException("Articolo non trovato");
        var image = new MerchItemImage { MerchItemId = itemId, Path = path, Ordine = item.Immagini.Count };
        _db.MerchItemImages.Add(image);
        await _db.SaveChangesAsync();
        return path;
    }

    public async Task<bool> DeleteItemImageAsync(int imageId)
    {
        var img = await _db.MerchItemImages.FindAsync(imageId);
        if (img == null) return false;
        _db.MerchItemImages.Remove(img);
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
        Immagini = m.Immagini.OrderBy(i => i.Ordine).Select(i => i.Path).ToList(),
        Varianti = m.Varianti.Select(v => new MerchItemVariantDTO
        {
            Id = v.Id,
            MerchItemId = v.MerchItemId,
            Colore = v.Colore,
            Taglia = v.Taglia,
            Stock = v.Stock,
            Prezzo = v.Prezzo
        }).ToList(),
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
        ImportoCarta = o.ImportoCarta,
        ImportoCredito = o.ImportoCredito,
        CheckoutExpiresAtUtc = o.CheckoutExpiresAtUtc,
        LastPaymentError = o.LastPaymentError,
        TipoConsegna = o.TipoConsegna,
        Indirizzo = o.Indirizzo,
        Citta = o.Citta,
        CAP = o.CAP,
        Provincia = o.Provincia,
        Telefono = o.Telefono,
        CinemaRitiroId = o.CinemaRitiroId,
        CinemaRitiroNome = o.CinemaRitiro?.Nome,
        CostoSpedizione = o.CostoSpedizione,
        StatoSpedizione = o.StatoSpedizione,
        TrackingNumber = o.TrackingNumber,
        DataConsegnaPrevista = o.DataConsegnaPrevista,
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
