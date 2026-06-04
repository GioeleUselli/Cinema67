using FilmAPI.Data;
using FilmAPI.DTO;
using FilmAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace FilmAPI.Services;

public class PopolaDbService
{
    private readonly FilmDbContext _db;
    private readonly ITmdbService _tmdb;
    private readonly ICinemaService _cinema;
    private readonly ISalaService _sala;
    private readonly IFilmService _film;
    private readonly IShowService _show;
    private readonly ILogger<PopolaDbService> _logger;

    public PopolaDbService(
        FilmDbContext db,
        ITmdbService tmdb,
        ICinemaService cinema,
        ISalaService sala,
        IFilmService film,
        IShowService show,
        ILogger<PopolaDbService> logger)
    {
        _db = db; _tmdb = tmdb; _cinema = cinema;
        _sala = sala; _film = film; _show = show; _logger = logger;
    }

    public async Task<PopolaResult> PopolaTuttoAsync()
    {
        var result = new PopolaResult();
        try
        {
            _logger.LogInformation("=== POPOLA DB START ===");

            // 1. Create cinemas
            await CreaCinemaAsync(result, "Multisala Cityplex", "Via Torino 15", "Milano", "20123");
            await CreaCinemaAsync(result, "Cinema d'Essai", "Via del Corso 42", "Roma", "00187");
            await CreaCinemaAsync(result, "Arena Estiva", "Lungomare Caracciolo 1", "Napoli", "80122");

            // 2. Create halls for each cinema
            var cinemas = await _db.Cinemas.ToListAsync();
            foreach (var c in cinemas)
            {
                await CreaSaleAsync(result, c.Id, c.Nome.StartsWith("Multisala") ? 6 : c.Nome.StartsWith("Cinema") ? 3 : 2);
            }

            // 3. Import popular films from TMDB
            var tmdbIds = new[] { 27205, 157336, 550, 680, 155, 13, 238, 424, 497, 603, 120, 122 };
            foreach (var tmdbId in tmdbIds)
            {
                await ImportaFilmAsync(result, tmdbId);
            }

            // 4. Create shows for next 7 days
            var films = await _db.Films.Where(f => f.TmdbId != null).ToListAsync();
            var sale = await _db.Sale.Include(s => s.Cinema).ToListAsync();
            var rng = new Random();
            var now = DateTime.UtcNow.Date.AddDays(1); // start tomorrow

            for (int day = 0; day < 7; day++)
            {
                var date = now.AddDays(day);
                var filmsCopy = films.OrderBy(_ => rng.Next()).Take(sale.Count).ToList();
                
                for (int i = 0; i < filmsCopy.Count; i++)
                {
                    var s = sale[i % sale.Count];
                    try
                    {
                        var start = date.AddHours(14 + rng.Next(0, 4) * 3 + rng.NextDouble() * 0.5);
                        await _show.CreateAsync(new ShowCreateDTO
                        {
                            CinemaId = s.CinemaId,
                            SalaId = s.Id,
                            FilmId = filmsCopy[i].Id,
                            StartAtUtc = start,
                            PrezzoBase = 7.50m + rng.Next(0, 5)
                        });
                        result.SpettacoliCreati++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Show create skipped for film {FilmId} in sala {SalaId}", filmsCopy[i].Id, s.Id);
                    }
                }
            }

            _logger.LogInformation("=== POPOLA DB COMPLETED ===");
            result.Success = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Popola DB failed");
            result.Errori.Add(ex.Message);
        }
        return result;
    }

    private async Task CreaCinemaAsync(PopolaResult r, string nome, string indirizzo, string citta, string cap)
    {
        try
        {
            var exists = await _db.Cinemas.AnyAsync(c => c.Nome == nome);
            if (exists) { r.Log.Add($"Cinema '{nome}' già esistente, skip."); return; }
            
            // Use direct DbContext to set all fields (CreateAsync only sets 3 fields)
            var cinema = new Cinema
            {
                Nome = nome,
                Indirizzo = indirizzo,
                Citta = citta,
                CAP = cap,
                Telefono = $"+39 0{new Random().Next(10, 99)} {new Random().Next(1000000, 9999999)}",
                CodiceLocale = nome.Replace(" ", "").ToUpper()[..Math.Min(4, nome.Replace(" ", "").Length)]
            };
            _db.Cinemas.Add(cinema);
            await _db.SaveChangesAsync();
            r.CinemaCreati++;
            r.Log.Add($"✅ Cinema '{nome}' creato.");
        }
        catch (Exception ex) { r.Errori.Add($"Cinema '{nome}': {ex.Message}"); }
    }

    private async Task CreaSaleAsync(PopolaResult r, int cinemaId, int count)
    {
        var tipi = new[] { TipoSala.DueD, TipoSala.DueD, TipoSala.TreD, TipoSala.XL, TipoSala.ISENSE, TipoSala.DueD };
        var supplementi = new[] { 0m, 0m, 2m, 1.5m, 3m, 0m };
        
        for (int i = 0; i < count; i++)
        {
            try
            {
                var tipo = tipi[i % tipi.Length];
                await _sala.CreateAsync(new SalaCreateDTO
                {
                    CinemaId = cinemaId,
                    NumeroProgressivo = i + 1,
                    TipoSala = tipo,
                    Nome = tipo switch { TipoSala.ISENSE => "iSense", TipoSala.TreD => "3D", TipoSala.XL => "XL", _ => $"Sala {i + 1}" },
                    Supplemento = supplementi[i % supplementi.Length],
                    IsAttiva = true
                });
                r.SaleCreate++;
            }
            catch (Exception ex) { r.Errori.Add($"Sala {i+1} cinema {cinemaId}: {ex.Message}"); }
        }
    }

    private async Task ImportaFilmAsync(PopolaResult r, int tmdbId)
    {
        try
        {
            // Skip if already imported
            var exists = await _db.Films.AnyAsync(f => f.TmdbId == tmdbId);
            if (exists) { r.Log.Add($"Film TMDB #{tmdbId} già presente, skip."); return; }

            var detail = await _tmdb.GetFilmDetailAsync(tmdbId);
            if (detail == null) { r.Errori.Add($"TMDB #{tmdbId}: nessun dettaglio."); return; }

            // Find or create director
            var nameParts = (detail.DirectorName ?? "Sconosciuto").Split(' ', 2);
            var nome = nameParts.Length > 0 ? nameParts[0] : "Sconosciuto";
            var cognome = nameParts.Length > 1 ? nameParts[1] : "";
            var regista = await _db.Registi.FirstOrDefaultAsync(rr => rr.Nome == nome && rr.Cognome == cognome);
            if (regista == null)
            {
                regista = new Regista { Nome = nome, Cognome = cognome, Nazionalita = "" };
                _db.Registi.Add(regista);
                await _db.SaveChangesAsync();
                r.RegistiCreati++;
            }

            var releaseDate = !string.IsNullOrWhiteSpace(detail.ReleaseDate) &&
                DateTime.TryParse(detail.ReleaseDate, out var parsed) ? parsed : DateTime.UtcNow;

            var filmDto = new FilmCreateDTO
            {
                Titolo = detail.Title ?? $"TMDB #{tmdbId}",
                DataProduzione = releaseDate,
                RegistaId = regista.Id,
                Durata = detail.Runtime > 0 ? detail.Runtime : 120,
                DescrizioneLunga = detail.Overview ?? "",
                CastText = string.Join(", ", detail.Cast ?? new List<string>()),
                CopertinaPath = !string.IsNullOrWhiteSpace(detail.PosterPath)
                    ? $"https://image.tmdb.org/t/p/w342{detail.PosterPath}" : null,
                DataRilascio = DateOnly.FromDateTime(releaseDate),
                CategorieIds = new List<int>()
            };

            var created = await _film.CreateAsync(filmDto);

            // Set TmdbId
            var film = await _db.Films.FindAsync(created.Id);
            if (film != null) { film.TmdbId = tmdbId; await _db.SaveChangesAsync(); }

            r.FilmImportati++;
            r.Log.Add($"✅ Film '{detail.Title}' importato.");
        }
        catch (Exception ex) { r.Errori.Add($"TMDB #{tmdbId}: {ex.Message}"); }
    }
}

public class PopolaResult
{
    public bool Success { get; set; }
    public int CinemaCreati { get; set; }
    public int SaleCreate { get; set; }
    public int FilmImportati { get; set; }
    public int SpettacoliCreati { get; set; }
    public int RegistiCreati { get; set; }
    public List<string> Log { get; set; } = new();
    public List<string> Errori { get; set; } = new();
}
