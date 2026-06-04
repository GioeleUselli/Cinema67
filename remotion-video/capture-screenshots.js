const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE = "https://www.cinema67.it";
const OUTPUT = path.join(__dirname, "src", "assets");

const pages = [
  { name: "home", url: `${BASE}/index.html` },
  { name: "login", url: `${BASE}/login.html` },
  { name: "programmazione", url: `${BASE}/programmazione.html` },
  { name: "shop", url: `${BASE}/shop.html` },
  { name: "giftcard", url: `${BASE}/giftcard.html` },
  { name: "membership", url: `${BASE}/membership.html` },
  { name: "feste", url: `${BASE}/feste.html` },
  { name: "profilo", url: `${BASE}/profilo.html` },
];

(async () => {
  if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  for (const p of pages) {
    console.log(`Capturing: ${p.name}...`);
    try {
      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000)); // wait for animations
      await page.screenshot({
        path: path.join(OUTPUT, `${p.name}.png`),
        fullPage: false,
      });
      console.log(`  ✅ ${p.name}.png saved`);
    } catch (e) {
      console.log(`  ❌ ${p.name} failed: ${e.message}`);
    }
  }

  await browser.close();
  console.log("Done!");
})();
