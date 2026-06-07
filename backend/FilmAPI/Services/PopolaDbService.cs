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

            // 1. Create cinemas (Cinema67 branded + others)
            var cinemaData = new (string nome, string indirizzo, string citta, string cap, int sale)[]
            {
                ("Cinema67 Milano Duomo",     "Via Torino 15",          "Milano",       "20123", 6),
                ("Cinema67 Roma Trastevere",  "Viale Trastevere 88",    "Roma",         "00153", 5),
                ("Cinema67 Napoli Centro",    "Via Toledo 120",         "Napoli",       "80132", 4),
                ("Cinema67 Firenze",          "Piazza della Signoria 3", "Firenze",      "50122", 3),
                ("Cinema67 Torino",           "Corso Vittorio Emanuele 45", "Torino",    "10121", 3),
                ("Cinema67 Bologna",          "Via Indipendenza 12",     "Bologna",      "40121", 3),
                ("Multisala Cityplex",        "Viale Monza 250",         "Milano",       "20127", 8),
                ("Cinema d'Essai",            "Via del Corso 42",        "Roma",         "00187", 3),
                ("Arena Estiva",              "Lungomare Caracciolo 1",  "Napoli",       "80122", 1),
            };
            foreach (var (nome, indirizzo, citta, cap, sale) in cinemaData)
                await CreaCinemaAsync(result, nome, indirizzo, citta, cap, sale);

            // 2. Import LOTS of films from TMDB (popular, top-rated, trending, now-playing)
            var allTmdbFilms = new List<TmdbFilmDTO>();
            
            // Get 5 pages of popular (100 films)
            for (int p = 1; p <= 5; p++)
                allTmdbFilms.AddRange(await _tmdb.GetPopularFilmsAsync(p));
            
            // Get 5 pages of top-rated (100 films)
            for (int p = 1; p <= 5; p++)
                allTmdbFilms.AddRange(await _tmdb.GetTopRatedFilmsAsync(p));
            
            // Get trending and now-playing
            allTmdbFilms.AddRange(await _tmdb.GetTrendingFilmsAsync());
            allTmdbFilms.AddRange(await _tmdb.GetNowPlayingFilmsAsync());
            
            // Deduplicate by ID
            var uniqueFilms = allTmdbFilms
                .GroupBy(f => f.Id)
                .Select(g => g.First())
                .ToList();
            
            _logger.LogInformation("Got {Count} unique films from TMDB to import", uniqueFilms.Count);
            
            foreach (var tmdbFilm in uniqueFilms)
            {
                await ImportaFilmAsync(result, tmdbFilm.Id);
            }

            // 3. Create shows for next 7 days - multiple time slots per hall
            var films = await _db.Films.Where(f => f.TmdbId != null).ToListAsync();
            var sale = await _db.Sale.Include(s => s.Cinema).ToListAsync();
            var rng = new Random();
            var now = DateTime.UtcNow.Date.AddDays(1); // start tomorrow
            var orari = new[] { 14.0, 16.5, 19.0, 21.5 }; // 14:00, 16:30, 19:00, 21:30

            for (int day = 0; day < 7; day++)
            {
                var date = now.AddDays(day);
                var shuffledFilms = films.OrderBy(_ => rng.Next()).ToList();
                
                foreach (var s in sale)
                {
                    // Each hall gets 2-4 shows per day with different films
                    var numShows = rng.Next(2, 5);
                    var salaFilms = shuffledFilms.Skip(rng.Next(0, Math.Max(1, shuffledFilms.Count - numShows))).Take(numShows).ToList();
                    
                    for (int j = 0; j < salaFilms.Count && j < orari.Length; j++)
                    {
                        try
                        {
                            var start = date.AddHours(orari[j] + rng.NextDouble() * 0.2);
                            await _show.CreateAsync(new ShowCreateDTO
                            {
                                CinemaId = s.CinemaId,
                                SalaId = s.Id,
                                FilmId = salaFilms[j].Id,
                                StartAtUtc = start,
                                PrezzoBase = 7.50m + rng.Next(0, 5)
                            });
                            result.SpettacoliCreati++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Show create skipped for film {FilmId} in sala {SalaId}", salaFilms[j].Id, s.Id);
                        }
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

    private async Task CreaCinemaAsync(PopolaResult r, string nome, string indirizzo, string citta, string cap, int numSale)
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
            
            // Create halls for this cinema
            await CreaSaleAsync(r, cinema.Id, numSale);
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
