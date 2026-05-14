using FilmAPI.DTO;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using ZXing;
using ZXing.OneD;
using ZXing.QrCode;
using ZXing.Rendering;

namespace FilmAPI.Services;

public class PdfService : IPdfService
{
    public byte[] GenerateOrderTicketsPdf(OrdineTicketDocumentDTO dto)
    {
        return Document.Create(container =>
        {
            foreach (var t in dto.Tickets)
            {
                container.Page(page => RenderTicketPage(page, t, dto.CodiceOrdine));
            }

            if (dto.Cibo.Count > 0)
            {
                container.Page(page => RenderFoodPage(page, dto));
            }
        })
        .WithSettings(new DocumentSettings { CompressDocument = false, ImageCompressionQuality = ImageCompressionQuality.High })
        .GeneratePdf();
    }

    private static void RenderTicketPage(PageDescriptor page, TicketPdfModel t, string codiceOrdine)
    {
        page.Size(PageSizes.A4);
        page.Margin(24);

        page.Header().Column(c =>
        {
            c.Spacing(4);
            c.Item().Text("Cinema67 - Biglietto digitale").Bold().FontSize(20);
            c.Item().Text($"Ordine {codiceOrdine}").FontSize(11).FontColor(Colors.Grey.Darken2);
        });

        page.Content().PaddingVertical(12).Column(c =>
        {
            c.Spacing(12);

            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(info =>
            {
                info.Spacing(6);
                info.Item().Text($"Film: {t.FilmTitolo}").SemiBold().FontSize(16);
                info.Item().Text($"Data e ora: {Fmt(t.StartAtUtc)}");
                info.Item().Text($"Cinema: {t.CinemaNome}, {t.CinemaCitta}");
                info.Item().Text($"Sala: {t.SalaNome}, Posto: {t.Settore} Fila {t.Fila} N.{t.Numero}");
            });

            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(price =>
            {
                price.Spacing(4);
                price.Item().Text("Prezzo").SemiBold();
                price.Item().Text($"Totale: {FmtAmt(t.PrezzoTotale)} EUR").Bold();
            });

            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(code =>
            {
                code.Spacing(6);
                code.Item().Text("Codici").SemiBold();
                code.Item().Text($"Biglietto: {t.CodiceBiglietto}").Bold();
            });

            c.Item().Row(row =>
            {
                row.Spacing(16);
                row.ConstantItem(110).Column(qr =>
                {
                    qr.Item().Text("QR").SemiBold();
                    qr.Item().Width(100).Height(100).Image(GenQr(t.ValidationUrl)).FitArea();
                });
                row.RelativeItem().Column(bc =>
                {
                    bc.Item().Text("Barcode").SemiBold();
                    bc.Item().Height(80).Svg(sz => GenBarcode(t.BarcodeValue, sz));
                    bc.Item().Text(t.BarcodeValue).FontSize(9);
                });
            });
        });

        page.Footer().AlignCenter().Text($"Cinema67 - {t.CodiceBiglietto}").FontSize(10);
    }

    private static void RenderFoodPage(PageDescriptor page, OrdineTicketDocumentDTO dto)
    {
        page.Size(PageSizes.A4);
        page.Margin(24);

        page.Header().Column(c =>
        {
            c.Spacing(4);
            c.Item().Text("Cinema67 - Scontrino Cibo e Bevande").Bold().FontSize(20);
            c.Item().Text($"Ordine {dto.CodiceOrdine}").FontSize(11).FontColor(Colors.Grey.Darken2);
        });

        page.Content().PaddingVertical(12).Column(c =>
        {
            c.Spacing(8);

            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(table =>
            {
                table.Spacing(4);
                table.Item().Row(r =>
                {
                    r.ConstantItem(200).Text("Articolo").SemiBold();
                    r.ConstantItem(60).AlignRight().Text("Q.tà").SemiBold();
                    r.ConstantItem(80).AlignRight().Text("Prezzo").SemiBold();
                    r.ConstantItem(80).AlignRight().Text("Subtotale").SemiBold();
                });
                table.Item().PaddingTop(4).BorderTop(1).BorderColor(Colors.Grey.Lighten2);

                foreach (var f in dto.Cibo)
                {
                    table.Item().Row(r =>
                    {
                        r.ConstantItem(200).Text(f.Nome).FontSize(10);
                        r.ConstantItem(60).AlignRight().Text(f.Quantita.ToString()).FontSize(10);
                        r.ConstantItem(80).AlignRight().Text(FmtAmt(f.PrezzoUnitario)).FontSize(10);
                        r.ConstantItem(80).AlignRight().Text(FmtAmt(f.SubTotale)).FontSize(10);
                    });
                }

                table.Item().PaddingTop(4).BorderTop(1).BorderColor(Colors.Grey.Lighten2);
                var foodTotal = dto.Cibo.Sum(f => f.SubTotale);
                table.Item().Row(r =>
                {
                    r.ConstantItem(340).AlignRight().Text($"Totale: {FmtAmt(foodTotal)} EUR").Bold();
                });
            });

            c.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Row(row =>
            {
                row.Spacing(16);
                row.ConstantItem(110).Column(qr =>
                {
                    qr.Item().Text("QR Ritiro Cibo").SemiBold();
                    if (dto.QrCodeCibo != null)
                    {
                        var qrBytes = System.Convert.FromBase64String(dto.QrCodeCibo.Replace("data:image/png;base64,", ""));
                        qr.Item().Width(100).Height(100).Image(qrBytes).FitArea();
                    }
                });
                row.RelativeItem().Column(info =>
                {
                    info.Spacing(6);
                    info.Item().Text("Codice ritiro cibo").SemiBold();
                    info.Item().Text(dto.CodiceCibo ?? "").Bold().FontSize(14);
                    info.Item().Text("Mostra questo codice in cassa").FontSize(10).FontColor(Colors.Grey.Darken2);
                });
            });
        });

        page.Footer().AlignCenter().Text($"Cinema67 - {dto.CodiceOrdine} - Scontrino Cibo").FontSize(10);
    }

    private static byte[] GenQr(string v) { using var g = new QRCodeGenerator(); using var d = g.CreateQrCode(v, QRCodeGenerator.ECCLevel.Q); return new PngByteQRCode(d).GetGraphic(8); }
    private static string GenBarcode(string v, Size sz) { var w = new Code128Writer(); var m = w.encode(v, BarcodeFormat.CODE_128, Math.Max(120, (int)sz.Width), Math.Max(60, (int)sz.Height)); return new SvgRenderer { FontName = "Arial", FontSize = 12 }.Render(m, BarcodeFormat.CODE_128, v).Content; }
    private static string Fmt(DateTime d) { var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Rome"); var l = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(d, DateTimeKind.Utc), tz); return l.ToString("dd/MM/yyyy HH:mm"); }
    private static string FmtAmt(decimal a) => a.ToString("0.00", CultureInfo.GetCultureInfo("it-IT"));
}
