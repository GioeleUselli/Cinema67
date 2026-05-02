using System.Collections.Concurrent;

namespace FilmAPI.Middleware;

public class RateLimiterMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ConcurrentDictionary<string, SlidingWindow> _windows = new();
    private readonly int _maxRequests;
    private readonly TimeSpan _windowDuration;

    public RateLimiterMiddleware(RequestDelegate next, int maxRequests = 20, int windowSeconds = 60)
    {
        _next = next;
        _maxRequests = maxRequests;
        _windowDuration = TimeSpan.FromSeconds(windowSeconds);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        if (!path.StartsWith("/auth/"))
        {
            await _next(context);
            return;
        }

        var key = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;
        var window = _windows.GetOrAdd(key, _ => new SlidingWindow());

        lock (window)
        {
            while (window.Timestamps.Count > 0 && now - window.Timestamps.Peek() > _windowDuration)
                window.Timestamps.Dequeue();

            if (window.Timestamps.Count >= _maxRequests)
            {
                context.Response.StatusCode = 429;
                context.Response.Headers["Retry-After"] = _windowDuration.TotalSeconds.ToString("F0");
                context.Response.ContentType = "application/json; charset=utf-8";
                context.Response.WriteAsync("{\"message\":\"Troppe richieste. Riprova piu tardi.\"}");
                return;
            }

            window.Timestamps.Enqueue(now);
        }

        await _next(context);
    }

    private class SlidingWindow
    {
        public Queue<DateTime> Timestamps { get; } = new();
    }
}
