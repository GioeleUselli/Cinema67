using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace FilmAPI.Services;

public interface IPayPalGateway
{
    Task<PayPalOrderResponse> CreateOrderAsync(PayPalCreateOrderRequest request, CancellationToken ct = default);
    Task<PayPalCaptureResponse> CaptureOrderAsync(string payPalOrderId, CancellationToken ct = default);
}

public class PayPalCreateOrderRequest
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string OrderCode { get; set; } = "";
    public string ReturnUrl { get; set; } = "";
    public string CancelUrl { get; set; } = "";
}

public class PayPalOrderResponse
{
    public string Id { get; set; } = "";
    public string Status { get; set; } = "";
    public string ApprovalUrl { get; set; } = "";
}

public class PayPalCaptureResponse
{
    public string Id { get; set; } = "";
    public string Status { get; set; } = "";
    public decimal AmountCaptured { get; set; }
}

public class PayPalGateway : IPayPalGateway
{
    private readonly HttpClient _http;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _baseUrl;

    public PayPalGateway()
    {
        _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        _clientId = Environment.GetEnvironmentVariable("PAYPAL_CLIENT_ID") ?? "";
        _clientSecret = Environment.GetEnvironmentVariable("PAYPAL_CLIENT_SECRET") ?? "";

        var sandbox = Environment.GetEnvironmentVariable("PAYPAL_SANDBOX") ?? "true";
        _baseUrl = sandbox.Equals("true", StringComparison.OrdinalIgnoreCase)
            ? "https://api-m.sandbox.paypal.com"
            : "https://api-m.paypal.com";
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_clientId}:{_clientSecret}"));
        var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v1/oauth2/token");
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);
        req.Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["grant_type"] = "client_credentials" });

        var resp = await _http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var eb = await resp.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException("PayPal auth error: " + eb[..Math.Min(200, eb.Length)]);
        }
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return json.GetProperty("access_token").GetString()!;
    }

    public async Task<PayPalOrderResponse> CreateOrderAsync(PayPalCreateOrderRequest request, CancellationToken ct = default)
    {
        var token = await GetAccessTokenAsync(ct);

        var body = new
        {
            intent = "CAPTURE",
            purchase_units = new[]
            {
                new
                {
                    reference_id = request.OrderCode,
                    amount = new
                    {
                        currency_code = request.Currency,
                        value = request.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
                    }
                }
            },
            payment_source = new
            {
                paypal = new
                {
                    experience_context = new
                    {
                        payment_method_preference = "IMMEDIATE_PAYMENT_REQUIRED",
                        brand_name = "Cinema67",
                        landing_page = "LOGIN",
                        return_url = request.ReturnUrl,
                        cancel_url = request.CancelUrl,
                        user_action = "PAY_NOW"
                    }
                }
            }
        };

        var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v2/checkout/orders");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var resp = await _http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var eb = await resp.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException("PayPal create error: " + eb[..Math.Min(200, eb.Length)]);
        }
        var orderJson = await resp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);

        var approvalUrl = "";
        if (orderJson.TryGetProperty("links", out var links))
        {
            foreach (var link in links.EnumerateArray())
            {
                if (link.GetProperty("rel").GetString() == "payer-action")
                    approvalUrl = link.GetProperty("href").GetString() ?? "";
            }
        }

        return new PayPalOrderResponse
        {
            Id = orderJson.GetProperty("id").GetString() ?? "",
            Status = orderJson.GetProperty("status").GetString() ?? "",
            ApprovalUrl = approvalUrl
        };
    }

    public async Task<PayPalCaptureResponse> CaptureOrderAsync(string payPalOrderId, CancellationToken ct = default)
    {
        var token = await GetAccessTokenAsync(ct);

        var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/v2/checkout/orders/{payPalOrderId}/capture");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Content = new StringContent("{}", Encoding.UTF8, "application/json");

        var resp = await _http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var eb = await resp.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException("PayPal capture error: " + eb[..Math.Min(200, eb.Length)]);
        }
        var json = await resp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);

        var status = json.GetProperty("status").GetString() ?? "";
        var amount = 0m;
        if (json.TryGetProperty("purchase_units", out var units) && units.GetArrayLength() > 0)
        {
            var payments = units[0].GetProperty("payments");
            if (payments.TryGetProperty("captures", out var captures) && captures.GetArrayLength() > 0)
            {
                var capture = captures[0];
                amount = decimal.Parse(capture.GetProperty("amount").GetProperty("value").GetString() ?? "0");
            }
        }

        return new PayPalCaptureResponse { Id = payPalOrderId, Status = status, AmountCaptured = amount };
    }
}
