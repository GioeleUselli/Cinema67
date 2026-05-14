namespace FilmAPI.DTO;

public class FoodItemDTO
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string? Descrizione { get; set; }
    public decimal Prezzo { get; set; }
    public string Categoria { get; set; } = "";
    public string? ImmaginePath { get; set; }
    public bool Attivo { get; set; }
}

public class FoodOrderRequestDTO
{
    public int OrdineId { get; set; }
    public List<FoodOrderItemDTO> Items { get; set; } = new();
}

public class FoodOrderItemDTO
{
    public int FoodItemId { get; set; }
    public int Quantita { get; set; } = 1;
}

public class FoodOrderItemDetailDTO
{
    public int Id { get; set; }
    public int FoodItemId { get; set; }
    public string Nome { get; set; } = "";
    public string? Descrizione { get; set; }
    public string Categoria { get; set; } = "";
    public int Quantita { get; set; }
    public decimal PrezzoUnitario { get; set; }
    public decimal SubTotale { get; set; }
    public bool Servito { get; set; }
}

public class FoodMenuDTO
{
    public List<FoodItemDTO> Popcorn { get; set; } = new();
    public List<FoodItemDTO> Bevande { get; set; } = new();
    public List<FoodItemDTO> Snack { get; set; } = new();
    public List<FoodItemDTO> Dolci { get; set; } = new();
}
