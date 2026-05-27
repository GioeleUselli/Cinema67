using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FilmAPI.DTO;

namespace FilmAPI.Services;

public interface ITmdbService
{
    Task<List<TmdbFilmDTO>> SearchFilmsAsync(string query);
    Task<TmdbFilmDetailDTO?> GetFilmDetailAsync(int tmdbId);
    Task<List<TmdbReviewDTO>> GetMovieReviewsAsync(int tmdbId);
}

public class TmdbService : ITmdbService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private const string TmdbBaseUrl = "https://api.themoviedb.org/3";

    public TmdbService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _apiKey = Environment.GetEnvironmentVariable("TMDB_API_KEY");
    }

    public async Task<List<TmdbFilmDTO>> SearchFilmsAsync(string query)
    {
        try
        {
            var url = BuildUrl($"/search/movie", query);
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new List<TmdbFilmDTO>();

            var jsonContent = await response.Content.ReadAsStringAsync();
            var content = JsonSerializer.Deserialize<TmdbSearchResponse>(jsonContent);
            return content?.Results?.Select(r => new TmdbFilmDTO
            {
                Id = r.Id,
                Title = r.Title,
                PosterPath = r.PosterPath,
                ReleaseDate = r.ReleaseDate,
                Overview = r.Overview
            }).ToList() ?? new List<TmdbFilmDTO>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error searching TMDB: {ex.Message}");
            return new List<TmdbFilmDTO>();
        }
    }

    public async Task<TmdbFilmDetailDTO?> GetFilmDetailAsync(int tmdbId)
    {
        try
        {
            var url = $"{TmdbBaseUrl}/movie/{tmdbId}?language=it-IT&append_to_response=credits";
            if (!string.IsNullOrWhiteSpace(_apiKey))
                url += $"&api_key={_apiKey}";

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return null;

            var jsonContent = await response.Content.ReadAsStringAsync();
            var content = JsonSerializer.Deserialize<TmdbMovieDetailResponse>(jsonContent);
            
            if (content is null)
                return null;

            var director = content.Credits?.Crew?.FirstOrDefault(c => c.Job == "Director");
            var runtime = content.Runtime > 0 ? content.Runtime : 120;
            
            return new TmdbFilmDetailDTO
            {
                Id = content.Id,
                Title = content.Title,
                PosterPath = content.PosterPath,
                ReleaseDate = content.ReleaseDate,
                Overview = content.Overview,
                Runtime = runtime,
                DirectorName = director?.Name,
                Genres = content.Genres?.Select(g => g.Name).ToList() ?? new List<string>(),
                Cast = content.Credits?.Cast?.Take(10).Select(c => c.Name).ToList() ?? new List<string>()
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting TMDB detail: {ex.Message}");
            return null;
        }
    }

    public async Task<List<TmdbReviewDTO>> GetMovieReviewsAsync(int tmdbId)
    {
        try
        {
            var url = $"{TmdbBaseUrl}/movie/{tmdbId}/reviews?language=it-IT";
            if (!string.IsNullOrWhiteSpace(_apiKey))
                url += $"&api_key={_apiKey}";

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return new List<TmdbReviewDTO>();

            var jsonContent = await response.Content.ReadAsStringAsync();
            var content = JsonSerializer.Deserialize<TmdbReviewsResponse>(jsonContent);
            
            return content?.Results?.Select(r => new TmdbReviewDTO
            {
                Autore = r.Author ?? "Autore sconosciuto",
                Contenuto = r.Content,
                Voto = r.AuthorDetails?.Rating,
                DataCreazione = DateTime.Now
            }).ToList() ?? new List<TmdbReviewDTO>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting TMDB reviews: {ex.Message}");
            return new List<TmdbReviewDTO>();
        }
    }

    private string BuildUrl(string endpoint, string? query = null)
    {
        var url = $"{TmdbBaseUrl}{endpoint}?language=it-IT";
        if (!string.IsNullOrWhiteSpace(query))
            url += $"&query={Uri.EscapeDataString(query)}";
        if (!string.IsNullOrWhiteSpace(_apiKey))
            url += $"&api_key={_apiKey}";
        return url;
    }
}

// TMDB Response classes
public class TmdbSearchResponse
{
    [JsonPropertyName("results")]
    public List<TmdbSearchResult>? Results { get; set; }
}

public class TmdbSearchResult
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }

    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }

    [JsonPropertyName("overview")]
    public string? Overview { get; set; }
}

public class TmdbMovieDetailResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("poster_path")]
    public string? PosterPath { get; set; }

    [JsonPropertyName("release_date")]
    public string? ReleaseDate { get; set; }

    [JsonPropertyName("overview")]
    public string? Overview { get; set; }

    [JsonPropertyName("runtime")]
    public int Runtime { get; set; }

    [JsonPropertyName("genres")]
    public List<TmdbGenre>? Genres { get; set; }

    [JsonPropertyName("credits")]
    public TmdbCredits? Credits { get; set; }
}

public class TmdbGenre
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class TmdbCredits
{
    [JsonPropertyName("cast")]
    public List<TmdbCastMember>? Cast { get; set; }

    [JsonPropertyName("crew")]
    public List<TmdbCrewMember>? Crew { get; set; }
}

public class TmdbCastMember
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }
}

public class TmdbCrewMember
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("job")]
    public string? Job { get; set; }
}

public class TmdbReviewsResponse
{
    [JsonPropertyName("results")]
    public List<TmdbReviewResult>? Results { get; set; }
}

public class TmdbReviewResult
{
    [JsonPropertyName("author")]
    public string? Author { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("author_details")]
    public TmdbAuthorDetails? AuthorDetails { get; set; }
}

public class TmdbAuthorDetails
{
    [JsonPropertyName("rating")]
    public double? Rating { get; set; }
}
