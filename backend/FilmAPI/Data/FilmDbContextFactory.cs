using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FilmAPI.Data;

public class FilmDbContextFactory : IDesignTimeDbContextFactory<FilmDbContext>
{
    public FilmDbContext CreateDbContext(string[] args)
    {
        var envCandidates = new[]
        {
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "backend", ".env")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".env")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env"))
        };

        var envPath = envCandidates.FirstOrDefault(File.Exists);
        if (!string.IsNullOrWhiteSpace(envPath))
        {
            Env.Load(envPath);
        }

        var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
        var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
        var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "film-api-db";
        var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "root";
        var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "root";
        var dbServerVersion = Environment.GetEnvironmentVariable("DB_SERVER_VERSION") ?? "10.11.0-mariadb";

        var connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};";

        var builder = new DbContextOptionsBuilder<FilmDbContext>();
        builder.UseMySql(connectionString, ServerVersion.Parse(dbServerVersion));
        return new FilmDbContext(builder.Options);
    }
}
