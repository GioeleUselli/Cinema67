namespace FilmAPI.Services;

public static class RedirectValidator
{
    public static bool IsValidInternalRedirect(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        if (path.StartsWith("/") && !path.StartsWith("//") && !path.Contains("\\"))
            return true;
        return false;
    }
}
