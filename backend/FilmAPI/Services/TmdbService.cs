using System.Net.Http.Json;
using System.Text.Json.Serialization;
using FilmAPI.DTO;

namespace FilmAPI.Services;

public interface ITmdbService
{
    Task<List<TmdbReviewDTO>> GetMovieReviewsAsync(int tmdbMovieId);
}

public class TmdbService : ITmdbService
{
    private readonly HttpClient _http;
    private readonly ILogger<TmdbService> _logger;

    public TmdbService(HttpClient http, ILogger<TmdbService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<List<TmdbReviewDTO>> GetMovieReviewsAsync(int tmdbMovieId)
    {
        try
        {
            var url = $"https://api.themoviedb.org/3/movie/{tmdbMovieId}/reviews?language=en-US&page=1";
            var response = await _http.GetFromJsonAsync<TmdbReviewsResponse>(url);
            if (response?.Results == null) return new List<TmdbReviewDTO>();

            return response.Results
                .Where(r => !string.IsNullOrWhiteSpace(r.Content))
                .Select(r => new TmdbReviewDTO
                {
                    Autore = r.Author ?? "Anonimo",
                    Contenuto = r.Content?.Length > 500 ? r.Content[..500] + "..." : r.Content,
                    Voto = r.AuthorDetails?.Rating,
                    DataCreazione = DateTime.TryParse(r.CreatedAt, out var dt) ? dt : DateTime.UtcNow
                })
                .Take(5)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Errore recupero recensioni TMDB per movieId {TmdbId}", tmdbMovieId);
            return new List<TmdbReviewDTO>();
        }
    }

    private class TmdbReviewsResponse
    {
        [JsonPropertyName("results")]
        public List<TmdbReviewItem>? Results { get; set; }
    }

    private class TmdbReviewItem
    {
        [JsonPropertyName("author")]
        public string? Author { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("created_at")]
        public string? CreatedAt { get; set; }

        [JsonPropertyName("author_details")]
        public TmdbAuthorDetails? AuthorDetails { get; set; }
    }

    private class TmdbAuthorDetails
    {
        [JsonPropertyName("rating")]
        public double? Rating { get; set; }
    }
}
