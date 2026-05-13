namespace FilmAPI.Services;

public class ShippingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<ShippingBackgroundService> _logger;

    public ShippingBackgroundService(IServiceProvider sp, ILogger<ShippingBackgroundService> logger)
    {
        _sp = sp; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(1), ct);
                await using var scope = _sp.CreateAsyncScope();
                var shipping = scope.ServiceProvider.GetRequiredService<IShippingService>();
                await shipping.ProcessShipmentsAsync();
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _logger.LogWarning(ex, "Errore simulazione spedizioni"); }
        }
    }
}
