namespace FilmAPI.Services;

public static class EmailTemplateHelper
{
    // Cinema67 brand colors
    private const string Gold = "#d4af37";
    private const string GoldDark = "#b8860b";
    private const string Red = "#b91c1c";
    private const string RedDark = "#991b1b";
    private const string Success = "#16a34a";
    private const string Warning = "#d97706";

    /// <summary>
    /// Wraps content in a full Cinema67-branded email with dark/light mode support.
    /// </summary>
    public static string Wrap(string title, string content, string? preheader = null)
    {
        return $@"<!DOCTYPE html>
<html lang=""it"">
<head>
<meta charset=""UTF-8"">
<meta name=""viewport"" content=""width=device-width,initial-scale=1.0"">
<meta name=""color-scheme"" content=""light dark"">
<title>{title}</title>
<style>
  :root {{ color-scheme: light dark; }}
  body {{ margin:0; padding:0; font-family:Arial,'Helvetica Neue',Helvetica,sans-serif; }}
  .email-bg {{ background:#f5f2ed; }}
  .email-card {{ max-width:540px; background:#ffffff; border-radius:0; }}
  .email-top {{ background:linear-gradient(135deg,#1a1614,#2d2418); padding:36px 28px 14px; text-align:center; }}
  .email-logo {{ font-family:Georgia,'Times New Roman',serif; font-size:30px; font-weight:900; color:{Gold}; letter-spacing:4px; }}
  .email-subtitle {{ color:#a89888; font-size:13px; margin:8px 0 0; }}
  .email-body {{ padding:28px; background:#ffffff; }}
  .email-body p {{ color:#3d3226; font-size:14px; line-height:1.6; margin:0 0 12px; }}
  .email-body strong {{ color:#1a1614; }}
  .email-footer {{ padding:20px 28px; text-align:center; background:#faf7f3; border-top:1px solid #e8e0d5; }}
  .email-footer p {{ color:#8c7b6b; font-size:11px; margin:0; }}
  .btn-gold {{ display:inline-block; padding:14px 36px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px; background:#{Gold}; color:#1a1614!important; }}
  .code-box {{ border:2px dashed #{Gold}; border-radius:8px; padding:20px 24px; text-align:center; margin:16px 0; background:#fdfaf4; }}
  .code-box span {{ font-family:'Courier New',monospace; font-size:24px; font-weight:700; color:{GoldDark}; letter-spacing:4px; }}
  .info-card {{ border-radius:8px; padding:14px 18px; margin:10px 0; background:#faf7f3; border:1px solid #e8e0d5; }}
  .info-card-label {{ font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#8c7b6b; margin:0 0 3px; }}
  .info-card-value {{ font-size:15px; font-weight:600; color:#1a1614; margin:0; }}
  /* Dark mode */
  @media (prefers-color-scheme: dark) {{
    .email-bg {{ background:#14100c; }}
    .email-card {{ background:#1c1713; }}
    .email-top {{ background:linear-gradient(135deg,#0f0c09,#1a1410); }}
    .email-body {{ background:#1c1713; }}
    .email-body p {{ color:#c4b8a8; }}
    .email-body strong {{ color:#f0e8e0; }}
    .email-footer {{ background:#14100c; border-top-color:#38302a; }}
    .email-footer p {{ color:#7a6b5d; }}
    .code-box {{ background:#1a1614; border-color:#d4af3755; }}
    .code-box span {{ color:{Gold}; }}
    .info-card {{ background:#1a1614; border-color:#38302a; }}
    .info-card-label {{ color:#a89888; }}
    .info-card-value {{ color:#f0e8e0; }}
    .btn-gold {{ color:#1a1614!important; }}
  }}
</style>
</head>
<body>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" class=""email-bg"" bgcolor=""#f5f2ed"" style=""background:#f5f2ed"">
<tr><td align=""center"" style=""padding:24px 12px"">

<table width=""540"" cellpadding=""0"" cellspacing=""0"" class=""email-card"" bgcolor=""#ffffff"" style=""background:#ffffff"">
<tr><td class=""email-top"" bgcolor=""#1a1614"" style=""background:#1a1614;padding:36px 28px 14px;text-align:center"">
<div class=""email-logo"">CINEMA67</div>
<div class=""email-subtitle"">{title}</div>
</td></tr>
<tr><td class=""email-body"" bgcolor=""#ffffff"" style=""background:#ffffff;padding:28px"">
{content}
</td></tr>
<tr><td class=""email-footer"" bgcolor=""#faf7f3"" style=""background:#faf7f3;padding:20px 28px;text-align:center;border-top:1px solid #e8e0d5"">
<p>Cinema67 &mdash; Il tuo cinema, la tua esperienza.</p>
<p style=""margin-top:4px"">Hai ricevuto questa email perch&eacute; hai un account su Cinema67.</p>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>";
    }

    public static string Card(string label, string value, string? accent = null)
    {
        var valStyle = accent != null ? $"color:{accent};" : "";
        return $@"<div class=""info-card""><div class=""info-card-label"">{label}</div><div class=""info-card-value"" style=""{valStyle}"">{value}</div></div>";
    }

    public static string CodeBox(string code, string label = "CODICE")
    {
        return $@"<div class=""code-box""><div style=""font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#8c7b6b;margin:0 0 8px"">{label}</div><span>{code}</span></div>";
    }

    public static string Button(string text, string url)
    {
        return $@"<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin:24px 0""><tr><td align=""center""><a href=""{url}"" class=""btn-gold"">{text}</a></td></tr></table>";
    }

    public static string Badge(string text, string type = "success")
    {
        var colors = type switch
        {
            "success" => "background:#16a34a22;color:#16a34a",
            "warning" => "background:#d9770622;color:#d97706",
            "error" => "background:#b91c1c22;color:#b91c1c",
            _ => "background:#16a34a22;color:#16a34a"
        };
        return $@"<span style=""display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;{colors}"">{text}</span>";
    }
}
