namespace FilmAPI.DTO;

public class FilmDTO
{
    public int Id { get; set; }
    public string Titolo { get; set; } = string.Empty;
    public DateTime DataProduzione { get; set; }
    public int RegistaId { get; set; }
    public string? RegistaNome { get; set; }
    public string? RegistaCognome { get; set; }
    public int Durata { get; set; }
    public string? CopertinaPath { get; set; }
    public string? FilmatoPath { get; set; }
    public string? DescrizioneLunga { get; set; }
    public string? CastText { get; set; }
    public DateOnly? DataRilascio { get; set; }
    public List<CategoriaDTO> Categorie { get; set; } = new();
}

public class FilmPagedResultDTO
{
    public List<FilmDTO> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}

public class FilmCreateDTO
{
    public string Titolo { get; set; } = string.Empty;
    public DateTime DataProduzione { get; set; }
    public int RegistaId { get; set; }
    public int Durata { get; set; }
    public string? CopertinaPath { get; set; }
    public string? FilmatoPath { get; set; }
    public string? DescrizioneLunga { get; set; }
    public string? CastText { get; set; }
    public DateOnly? DataRilascio { get; set; }
    public List<int>? CategorieIds { get; set; }
}

public class FilmUpdateDTO
{
    public string Titolo { get; set; } = string.Empty;
    public DateTime DataProduzione { get; set; }
    public int RegistaId { get; set; }
    public int Durata { get; set; }
    public string? CopertinaPath { get; set; }
    public string? FilmatoPath { get; set; }
    public string? DescrizioneLunga { get; set; }
    public string? CastText { get; set; }
    public DateOnly? DataRilascio { get; set; }
    public List<int>? CategorieIds { get; set; }
}

public class TmdbFilmDTO
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? PosterPath { get; set; }
    public string? ReleaseDate { get; set; }
    public string? Overview { get; set; }
}

public class TmdbFilmDetailDTO
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? PosterPath { get; set; }
    public string? ReleaseDate { get; set; }
    public string? Overview { get; set; }
    public int Runtime { get; set; }
    public string? DirectorName { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Cast { get; set; } = new();
}

public class TmdbImportDTO
{
    public int TmdbId { get; set; }
    public int RegistaId { get; set; }
    public List<int>? CategorieIds { get; set; }
    public string Posizione { get; set; } = "evidenza"; // "evidenza" o "uscita"
    public DateOnly? DataRilascio { get; set; }
}
