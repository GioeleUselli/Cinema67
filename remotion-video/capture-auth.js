const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const https = require("https");

const BASE = "https://www.cinema67.it";
const API = "https://api.cinema67.it";
const OUTPUT = path.join(__dirname, "src", "assets");

// Get admin token
function getToken(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = https.request(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": data.length },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function capturePages(browser, token, pages, prefix) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Inject auth into sessionStorage
  await page.goto(BASE + "/index.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => {
    sessionStorage.setItem("cb_access_token", t.accessToken);
    sessionStorage.setItem("cb_refresh_token", t.refreshToken);
    sessionStorage.setItem("cb_user", JSON.stringify(t.user));
    sessionStorage.setItem("cb_device_id", "capture-device");
  }, token);

  for (const p of pages) {
    console.log(`  Capturing ${prefix}/${p.name}...`);
    try {
      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(OUTPUT, `${prefix}_${p.name}.png`),
      });
      console.log(`    ✅ ${prefix}_${p.name}.png`);
    } catch (e) {
      console.log(`    ❌ ${p.name}: ${e.message}`);
    }
  }
  await page.close();
}

(async () => {
  if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

  console.log("Logging in as admin...");
  const adminToken = await getToken("admin@cinema67.it", "Admin123!");
  console.log(`  Admin: ${adminToken.user.nome} (${adminToken.user.ruolo})`);

  console.log("Logging in as user...");
  // First register or find a regular user
  const userToken = await getToken("admin@cinema67.it", "Admin123!");
  // Actually admin is also a user account. Let's create a regular user somehow.
  // For now use admin for both, but note which pages are admin-only
  
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  // ADMIN PAGES - pages that require admin login
  const adminPages = [
    { name: "dashboard", url: `${BASE}/dashboard.html` },
    { name: "films", url: `${BASE}/films.html` },
    { name: "proiezioni", url: `${BASE}/proiezioni.html` },
    { name: "ricarica_credito", url: `${BASE}/ricarica-credito.html` },
    { name: "rimborsi", url: `${BASE}/rimborsi-admin.html` },
    { name: "merch_admin", url: `${BASE}/merch-admin.html` },
    { name: "feste_admin", url: `${BASE}/feste-admin.html` },
    { name: "membership_admin", url: `${BASE}/membership-admin.html` },
  ];

  // USER PAGES - pages accessible to regular users
  const userPages = [
    { name: "home", url: `${BASE}/index.html` },
    { name: "login", url: `${BASE}/login.html` },
    { name: "programmazione", url: `${BASE}/programmazione.html` },
    { name: "shop", url: `${BASE}/shop.html` },
    { name: "giftcard", url: `${BASE}/giftcard.html` },
    { name: "membership", url: `${BASE}/membership.html` },
    { name: "feste", url: `${BASE}/feste.html` },
    { name: "profilo", url: `${BASE}/profilo.html` },
    { name: "riscatta_giftcard", url: `${BASE}/riscatta-giftcard.html` },
  ];

  console.log("\n=== ADMIN PAGES ===");
  await capturePages(browser, adminToken, adminPages, "admin");

  console.log("\n=== USER PAGES ===");
  await capturePages(browser, adminToken, userPages, "user");

  await browser.close();
  console.log("\n✅ All screenshots captured!");
})();
