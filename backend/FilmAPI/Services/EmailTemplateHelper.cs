namespace FilmAPI.Services;

public static class EmailTemplateHelper
{
    // Cinema67 brand colors
    private const string Gold = "#d4af37";
    private const string GoldDark = "#b8860b";
    private const string Red = "#b91c1c";
    private const string Surface = "#14100c";
    private const string SurfaceLight = "#1c1713";
    private const string Text = "#f0e8e0";
    private const string TextMuted = "#a89888";
    private const string Border = "#38302a";
    private const string CardBg = "#1a1614";
    private const string Success = "#22c55e";
    private const string Warning = "#f59e0b";

    /// <summary>
    /// Wraps content in a full Cinema67-branded email with dark/light mode support.
    /// </summary>
    public static string Wrap(string title, string content, string? preheader = null)
    {
        var ph = preheader ?? title;
        return $@"<!DOCTYPE html>
<html lang=""it"">
<head>
<meta charset=""UTF-8"">
<meta name=""viewport"" content=""width=device-width,initial-scale=1.0"">
<meta name=""color-scheme"" content=""dark light"">
<title>{title}</title>
<style>
  :root {{ color-scheme: dark light; }}
  body {{ margin:0; padding:0; font-family:'Space Grotesk',Arial,sans-serif; background:#14100c; color:#f0e8e0; }}
  .email-wrapper {{ max-width:560px; margin:0 auto; }}
  .email-header {{ padding:32px 24px 20px; text-align:center; background:linear-gradient(135deg,#1a1614,#14100c); }}
  .email-logo {{ font-family:'DM Serif Display',Georgia,serif; font-size:28px; font-weight:900; color:{Gold}; letter-spacing:3px; }}
  .email-divider {{ height:1px; background:linear-gradient(90deg,transparent,{Gold}44,transparent); margin:0 24px; }}
  .email-body {{ padding:24px; }}
  .email-footer {{ padding:20px 24px; text-align:center; border-top:1px solid {Border}; }}
  .email-footer p {{ color:{TextMuted}; font-size:11px; margin:0; }}
  .btn-gold {{ display:inline-block; background:linear-gradient(135deg,{Gold},{GoldDark}); color:#14100c!important; padding:12px 32px; border-radius:10px; text-decoration:none; font-weight:700; font-size:14px; }}
  .code-box {{ background:#1c1713; border:2px dashed {Gold}44; border-radius:10px; padding:16px 24px; text-align:center; margin:16px 0; }}
  .code-box span {{ font-family:monospace; font-size:22px; font-weight:700; color:{Gold}; letter-spacing:3px; }}
  .info-card {{ background:{CardBg}; border:1px solid {Border}; border-radius:12px; padding:16px 20px; margin:12px 0; }}
  .info-card-label {{ color:{TextMuted}; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin:0 0 2px; }}
  .info-card-value {{ color:{Text}; font-size:15px; font-weight:600; margin:0; }}
  .status-badge {{ display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }}
  .status-success {{ background:{Success}22; color:{Success}; }}
  .status-warning {{ background:{Warning}22; color:{Warning}; }}
  .status-error {{ background:{Red}22; color:{Red}; }}
  @media (prefers-color-scheme: light) {{
    body {{ background:#f5f0eb; color:#1a1614; }}
    .email-header {{ background:linear-gradient(135deg,#ede4d8,#f5f0eb); }}
    .email-logo {{ color:#b8860b; }}
    .email-body {{ background:#fffefb; }}
    .email-footer {{ border-top-color:#d4c5b5; }}
    .email-footer p {{ color:#7a6b5d; }}
    .code-box {{ background:#faf5ed; border-color:#d4af3722; }}
    .code-box span {{ color:#b8860b; }}
    .info-card {{ background:#faf5ed; border-color:#d4c5b5; }}
    .info-card-label {{ color:#7a6b5d; }}
    .info-card-value {{ color:#1a1614; }}
    .btn-gold {{ color:#fffefb!important; }}
  }}
</style>
</head>
<body>
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:{Surface}"">
<tr><td align=""center"" style=""padding:32px 16px"">
<div class=""email-wrapper"">

<div class=""email-header"">
<div class=""email-logo"">CINEMA67</div>
<p style=""color:{TextMuted};font-size:12px;margin:6px 0 0"">{title}</p>
</div>
<div class=""email-divider""></div>

<div class=""email-body"">
{content}
</div>

<div class=""email-footer"">
<p>Cinema67 — Il tuo cinema, la tua esperienza.</p>
<p style=""margin-top:4px"">Hai ricevuto questa email perch&eacute; hai un account su Cinema67.</p>
</div>

</div>
</td></tr>
</table>
</body>
</html>";
    }

    /// <summary>
    /// Simple inline card (no full wrap) for inline content within templates.
    /// </summary>
    public static string Card(string label, string value, string? accent = null)
    {
        var valStyle = accent != null ? $"color:{accent}" : "";
        return $@"<div class=""info-card""><p class=""info-card-label"">{label}</p><p class=""info-card-value"" style=""{valStyle}"">{value}</p></div>";
    }

    /// <summary>
    /// Renders a discount/gift card code in a styled box.
    /// </summary>
    public static string CodeBox(string code, string label = "CODICE")
    {
        return $@"<div class=""code-box""><p style=""color:{TextMuted};font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px"">{label}</p><span>{code}</span></div>";
    }

    /// <summary>
    /// Gold CTA button.
    /// </summary>
    public static string Button(string text, string url)
    {
        return $@"<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin:20px 0""><tr><td align=""center""><a href=""{url}"" class=""btn-gold"">{text}</a></td></tr></table>";
    }

    /// <summary>
    /// Status badge (success, warning, error).
    /// </summary>
    public static string Badge(string text, string type = "success")
    {
        return $@"<span class=""status-badge status-{type}"">{text}</span>";
    }
}
