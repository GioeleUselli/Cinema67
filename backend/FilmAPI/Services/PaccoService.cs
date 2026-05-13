using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace FilmAPI.Services;

public interface IPaccoService
{
    Task<List<PaccoDTO>> GetPacchiDaPreparareAsync();
    Task<List<MerchOrderDTO>> GetOrdiniPagatiSenzaPaccoAsync();
    Task<List<PaccoDTO>> GetPacchiProntiAsync();
    Task<List<PaccoDTO>> GetPacchiCorriereAsync(int corriereId);
    Task<List<PaccoDTO>> GetAllPacchiAsync();
    Task<PaccoDTO> CreaPaccoAsync(int merchOrderId, int preparatoreId);
    Task<PaccoDTO?> PrendiInCaricoAsync(int paccoId, int corriereId);
    Task<PaccoDTO?> SegnaInConsegnaAsync(int paccoId);
    Task<PaccoDTO?> SegnaConsegnatoAsync(int paccoId, string? firma, string? note);
    Task<PaccoDTO?> SegnaMancataConsegnaAsync(int paccoId, string? note);
    Task<PaccoDTO?> GetByCodiceInternoAsync(string codice);
    Task<PaccoDTO?> GetByIdAsync(int id);
}

public class PaccoService : IPaccoService
{
    private readonly FilmDbContext _db;
    private readonly IMerchService _merch;
    private readonly IEmailService _emailService;
    private readonly ILogger<PaccoService> _logger;

    public PaccoService(FilmDbContext db, IMerchService merch, IEmailService emailService, ILogger<PaccoService> logger)
    { _db = db; _merch = merch; _emailService = emailService; _logger = logger; }

    public async Task<List<MerchOrderDTO>> GetOrdiniPagatiSenzaPaccoAsync()
    {
        var paccoOrderIds = await _db.Pacchi.Select(p => p.MerchOrderId).ToListAsync();
        var orders = await _db.MerchOrders
            .Include(o => o.Items).ThenInclude(i => i.MerchItem)
            .Include(o => o.CinemaRitiro)
            .Where(o => o.Stato == "Paid" && !paccoOrderIds.Contains(o.Id))
            .OrderBy(o => o.PaidAtUtc)
            .ToListAsync();
        return orders.Select(o => new MerchOrderDTO
        {
            Id = o.Id, CodiceOrdine = o.CodiceOrdine, Totale = o.Totale,
            TipoConsegna = o.TipoConsegna,
            Destinazione = o.TipoConsegna == "Spedizione" ? $"{o.Indirizzo}, {o.CAP} {o.Citta}" : o.CinemaRitiro?.Nome ?? "",
            Items = o.Items.Select(i => new MerchOrderItemDetailDTO { Nome = i.MerchItem?.Nome ?? "", Quantita = i.Quantita }).ToList()
        }).ToList();
    }

    public async Task<List<PaccoDTO>> GetPacchiDaPreparareAsync()
    {
        var pacchi = await _db.Pacchi
            .Include(p => p.MerchOrder).ThenInclude(o => o!.Items).ThenInclude(i => i.MerchItem)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.User)
            .Where(p => p.Stato == PaccoStati.InAttesa || p.Stato == PaccoStati.DaPreparare)
            .OrderBy(p => p.CreatedAtUtc).ToListAsync();
        return pacchi.Select(Map).ToList();
    }

    public async Task<List<PaccoDTO>> GetPacchiProntiAsync()
    {
        var pacchi = await _db.Pacchi
            .Include(p => p.MerchOrder).ThenInclude(o => o!.Items).ThenInclude(i => i.MerchItem)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.User)
            .Include(p => p.Corriere)
            .Where(p => p.Stato == PaccoStati.Pronto)
            .OrderBy(p => p.CreatedAtUtc).ToListAsync();
        return pacchi.Select(Map).ToList();
    }

    public async Task<List<PaccoDTO>> GetPacchiCorriereAsync(int corriereId)
    {
        var pacchi = await _db.Pacchi
            .Include(p => p.MerchOrder).ThenInclude(o => o!.Items).ThenInclude(i => i.MerchItem)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.User)
            .Where(p => p.CorriereId == corriereId && (p.Stato == PaccoStati.InCarico || p.Stato == PaccoStati.InConsegna))
            .OrderByDescending(p => p.PresoInCaricoIl).ToListAsync();
        return pacchi.Select(Map).ToList();
    }

    public async Task<List<PaccoDTO>> GetAllPacchiAsync()
    {
        var pacchi = await _db.Pacchi
            .Include(p => p.MerchOrder).ThenInclude(o => o!.Items).ThenInclude(i => i.MerchItem)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.User)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.CinemaRitiro)
            .Include(p => p.Preparatore)
            .Include(p => p.Corriere)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();
        return pacchi.Select(Map).ToList();
    }

    public async Task<PaccoDTO> CreaPaccoAsync(int merchOrderId, int preparatoreId)
    {
        var order = await _db.MerchOrders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == merchOrderId && o.Stato == "Paid")
            ?? throw new ArgumentException("Ordine non trovato o non pagato.");

        var existing = await _db.Pacchi.FirstOrDefaultAsync(p => p.MerchOrderId == merchOrderId);
        if (existing != null) return Map(existing);

        var codice = GeneraCodiceInterno();
        var pacco = new Pacco
        {
            MerchOrderId = merchOrderId,
            CodicePacco = $"C67-{DateTime.UtcNow:yyMMdd}-{codice}",
            CodiceInterno = codice,
            PreparatoreId = preparatoreId,
            Stato = PaccoStati.Pronto,
            CreatedAtUtc = DateTime.UtcNow
        };

        // Generate QR code with internal code
        var qrGenerator = new QRCodeGenerator();
        var qrData = qrGenerator.CreateQrCode(codice, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrData);
        pacco.QrCodeData = "data:image/png;base64," + Convert.ToBase64String(qrCode.GetGraphic(10));

        _db.Pacchi.Add(pacco);

        // Update order shipping
        order.StatoSpedizione = "Pronto";
        order.TrackingNumber ??= pacco.CodicePacco;
        await _db.SaveChangesAsync();

        await SendTrackingEmailAsync(order, "Pronto", pacco.CodicePacco);

        return Map(pacco);
    }

    public async Task<PaccoDTO?> PrendiInCaricoAsync(int paccoId, int corriereId)
    {
        var pacco = await _db.Pacchi.FindAsync(paccoId);
        if (pacco == null || pacco.Stato != PaccoStati.Pronto) return null;
        pacco.CorriereId = corriereId;
        pacco.Stato = PaccoStati.InCarico;
        pacco.PresoInCaricoIl = DateTime.UtcNow;

        var order = await _db.MerchOrders.FindAsync(pacco.MerchOrderId);
        if (order != null) order.StatoSpedizione = "InCarico";

        await _db.SaveChangesAsync();

        if (order != null) await SendTrackingEmailAsync(order, "InCarico", pacco.CodicePacco);

        return await GetByIdAsync(paccoId);
    }

    public async Task<PaccoDTO?> SegnaInConsegnaAsync(int paccoId)
    {
        var pacco = await _db.Pacchi.FindAsync(paccoId);
        if (pacco == null || pacco.Stato != PaccoStati.InCarico) return null;
        pacco.Stato = PaccoStati.InConsegna;

        var order = await _db.MerchOrders.FindAsync(pacco.MerchOrderId);
        if (order != null) order.StatoSpedizione = "InConsegna";

        await _db.SaveChangesAsync();

        if (order != null) await SendTrackingEmailAsync(order, "InConsegna", pacco.CodicePacco);

        return await GetByIdAsync(paccoId);
    }

    public async Task<PaccoDTO?> SegnaConsegnatoAsync(int paccoId, string? firma, string? note)
    {
        var pacco = await _db.Pacchi.FindAsync(paccoId);
        if (pacco == null || pacco.Stato != PaccoStati.InConsegna) return null;
        pacco.Stato = PaccoStati.Consegnato;
        pacco.ConsegnatoIl = DateTime.UtcNow;
        pacco.Firma = firma?.Trim();
        pacco.NoteCorriere = note?.Trim();

        var order = await _db.MerchOrders.FindAsync(pacco.MerchOrderId);
        if (order != null)
        {
            order.StatoSpedizione = "Consegnato";
            order.DataConsegnaEffettiva = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        if (order != null) await SendTrackingEmailAsync(order, "Consegnato", pacco.CodicePacco);

        return await GetByIdAsync(paccoId);
    }

    public async Task<PaccoDTO?> SegnaMancataConsegnaAsync(int paccoId, string? note)
    {
        var pacco = await _db.Pacchi.FindAsync(paccoId);
        if (pacco == null || pacco.Stato != PaccoStati.InConsegna) return null;
        pacco.Stato = PaccoStati.MancataConsegna;
        pacco.TentataConsegnaIl = DateTime.UtcNow;
        pacco.NoteCorriere = note?.Trim();

        await _db.SaveChangesAsync();
        return await GetByIdAsync(paccoId);
    }

    public async Task<PaccoDTO?> GetByCodiceInternoAsync(string codice)
    {
        var pacco = await _db.Pacchi
            .Include(p => p.MerchOrder).ThenInclude(o => o!.Items).ThenInclude(i => i.MerchItem)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.User)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.CinemaRitiro)
            .FirstOrDefaultAsync(p => p.CodiceInterno == codice);
        return pacco == null ? null : Map(pacco);
    }

    public async Task<PaccoDTO?> GetByIdAsync(int id)
    {
        var pacco = await _db.Pacchi
            .Include(p => p.MerchOrder).ThenInclude(o => o!.Items).ThenInclude(i => i.MerchItem)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.User)
            .Include(p => p.MerchOrder!).ThenInclude(o => o!.CinemaRitiro)
            .FirstOrDefaultAsync(p => p.Id == id);
        return pacco == null ? null : Map(pacco);
    }

    private async Task SendTrackingEmailAsync(MerchOrder order, string stato, string trackingNumber)
    {
        try
        {
            var user = await _db.Users.FindAsync(order.UserId);
            var userEmail = user?.Email;
            if (string.IsNullOrWhiteSpace(userEmail)) return;

            var statusLabel = stato switch
            {
                "Pronto" => "Pacco pronto per la spedizione",
                "InCarico" => "Pacco preso in carico dal corriere",
                "InConsegna" => "Pacco in consegna",
                "Consegnato" => "Consegnato",
                _ => stato
            };

            var body = $@"<div style='max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#1a1614;color:#e0d8cc;padding:24px;border-radius:12px'>
<h2 style='color:#d4af37'>Cinema67 — Aggiornamento Spedizione</h2>
<p>Il tuo ordine <b>{order.CodiceOrdine}</b> è stato aggiornato:</p>
<p style='font-size:18px;color:#d4af37'><b>{statusLabel}</b></p>
<p>Tracking: <b>{trackingNumber}</b></p>
<p style='margin-top:16px'><a href='http://localhost:5001/tracking-merch.html?orderId={order.Id}' style='color:#d4af37;text-decoration:underline;font-size:14px'>Traccia la tua spedizione</a></p>
<p style='margin-top:24px;color:#8a8078;font-size:12px'>Cinema67 — L'Arte del Cinema</p></div>";

            await _emailService.SendHtmlEmailAsync(userEmail, $"Cinema67 — {statusLabel} — {order.CodiceOrdine}", body);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Email tracking pacco {OrderId} fallita", order.Id); }
    }

    private static string GeneraCodiceInterno()
    {
        var r = new Random();
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        return new string(Enumerable.Range(0, 8).Select(_ => chars[r.Next(chars.Length)]).ToArray());
    }

    private static PaccoDTO Map(Pacco p) => new()
    {
        Id = p.Id,
        MerchOrderId = p.MerchOrderId,
        CodiceOrdine = p.MerchOrder?.CodiceOrdine ?? "",
        CodicePacco = p.CodicePacco,
        CodiceInterno = p.CodiceInterno,
        QrCodeData = p.QrCodeData,
        Stato = p.Stato,
        PreparatoreId = p.PreparatoreId,
        PreparatoreNome = p.Preparatore != null ? $"{p.Preparatore.Nome} {p.Preparatore.Cognome}" : null,
        CorriereId = p.CorriereId,
        CorriereNome = p.Corriere != null ? $"{p.Corriere.Nome} {p.Corriere.Cognome}" : null,
        Destinazione = p.MerchOrder?.TipoConsegna == "Spedizione"
            ? $"{p.MerchOrder?.Indirizzo}, {p.MerchOrder?.CAP} {p.MerchOrder?.Citta}"
            : p.MerchOrder?.CinemaRitiro?.Nome ?? "",
        Items = p.MerchOrder?.Items?.Select(i => new PaccoItemDTO
        {
            Nome = i.MerchItem?.Nome ?? "", Quantita = i.Quantita
        }).ToList() ?? new(),
        PresoInCaricoIl = p.PresoInCaricoIl,
        ConsegnatoIl = p.ConsegnatoIl,
        TentataConsegnaIl = p.TentataConsegnaIl,
        NoteCorriere = p.NoteCorriere,
        Firma = p.Firma,
        CreatedAtUtc = p.CreatedAtUtc
    };
}
