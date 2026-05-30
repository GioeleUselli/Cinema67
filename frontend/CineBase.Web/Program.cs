var builder = WebApplication.CreateBuilder(args);

var apiBaseUrl = Environment.GetEnvironmentVariable("API_BASE_URL") ?? "http://localhost:5000";
var mediaBaseUrl = Environment.GetEnvironmentVariable("MEDIA_BASE_URL") ?? "http://localhost:5000";
var deploymentMode = Environment.GetEnvironmentVariable("DEPLOYMENT_MODE") ?? "development";

var app = builder.Build();

// API Reverse Proxy: forward /api/* to internal FilmAPI
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        var apiUrl = Environment.GetEnvironmentVariable("API_PROXY_URL");
        if (string.IsNullOrWhiteSpace(apiUrl))
        {
            context.Response.StatusCode = 502;
            await context.Response.WriteAsync("API proxy not configured");
            return;
        }
        using var client = new HttpClient { BaseAddress = new Uri(apiUrl), Timeout = TimeSpan.FromSeconds(30) };
        var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), context.Request.Path + context.Request.QueryString);
        foreach (var header in context.Request.Headers)
        {
            if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase))
                request.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
        if (context.Request.ContentLength > 0)
        {
            using var reader = new StreamReader(context.Request.Body);
            var content = await reader.ReadToEndAsync();
            request.Content = new StringContent(content, System.Text.Encoding.UTF8, System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/json"));
        }
        try
        {
            using var response = await client.SendAsync(request);
            context.Response.StatusCode = (int)response.StatusCode;
            foreach (var header in response.Headers)
                context.Response.Headers[header.Key] = header.Value.ToArray();
            foreach (var header in response.Content.Headers)
                context.Response.Headers[header.Key] = header.Value.ToArray();
            await response.Content.CopyToAsync(context.Response.Body);
        }
        catch
        {
            context.Response.StatusCode = 502;
        }
        return;
    }
    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        ctx.Context.Response.Headers.Append("Pragma", "no-cache");
        ctx.Context.Response.Headers.Append("Expires", "0");
    }
});

// Dynamic runtime configuration for frontend JavaScript
app.MapGet("/js/runtime-config.js", (HttpContext ctx) =>
{
    var content = $$"""
window.__RUNTIME_CONFIG__ = {
    apiBaseUrl: "{{apiBaseUrl}}",
    mediaBaseUrl: "{{mediaBaseUrl}}",
    deploymentMode: "{{deploymentMode}}"
};
""";
    ctx.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
    return Results.Content(content, "application/javascript");
});

// Container health probe
app.MapGet("/healthz", () => Results.Ok(new { status = "alive" }));

app.MapGet("/", () => Results.Redirect("/index.html"));

app.Run();
