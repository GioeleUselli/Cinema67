var builder = WebApplication.CreateBuilder(args);

var apiBaseUrl = Environment.GetEnvironmentVariable("API_BASE_URL") ?? "http://localhost:5000";
var mediaBaseUrl = Environment.GetEnvironmentVariable("MEDIA_BASE_URL") ?? "http://localhost:5000";
var deploymentMode = Environment.GetEnvironmentVariable("DEPLOYMENT_MODE") ?? "development";

var app = builder.Build();

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
