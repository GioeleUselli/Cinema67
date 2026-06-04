const https = require("https");
const fs = require("fs");
const path = require("path");

const audioDir = path.join(__dirname, "public", "audio");
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const narration = [
  "Tutto ciò che serve per gestire un cinema moderno in un'unica piattaforma.",
  "Login classico, Google, Microsoft. JWT, ruoli e massima sicurezza.",
  "Importa i film da TMDB con un click. Cast, poster, regista, tutto automatico.",
  "Crea la programmazione: sale, orari, prezzi. Pubblica con un click.",
  "Mappa posti interattiva. L'utente sceglie il posto, scatta l'hold di quattro minuti, checkout completato.",
  "Biglietteria digitale completa: QR code, PDF automatico, voucher e codici sconto.",
  "Shop merchandise ufficiale. Varianti per taglia e colore, stock gestito, ordini tracciati.",
  "Carrello sincronizzato su tutti i dispositivi. Aggiungi da smartphone, ritrovi su desktop.",
  "Gift card digitali personalizzabili. Invio programmato, messaggio dedicato, riscatto immediato.",
  "Quattro metodi di pagamento: Stripe, PayPal, Credito prepagato e metodo misto.",
  "Programma fedeltà a quattro livelli: Base, Silver, Gold e Platinum. Punti automatici ad ogni acquisto.",
  "Catalogo premi: riscatta i punti per biglietti gratis, gift card, merchandise e sconti.",
  "Prenota feste private al cinema. Tre tipi di evento, tre pacchetti, dal Basic al VIP.",
  "Rimborsi automatici. Show cancellato? Rimborso immediato su credito e carta. Email inviata.",
  "Diciannove template email brandizzati. Dark e light mode automatico. Invio fire and forget.",
  "Marketing integrato: campagne, codici sconto, promozioni festive e newsletter programmata.",
  "Tema automatico. L'app segue le preferenze del dispositivo: light mode di giorno, dark mode di notte.",
  "Architettura cloud su Microsoft Azure. Container Apps, CI/CD con GitHub Actions, scaling automatico.",
  "Stack tecnologico moderno: ASP.NET nove, MariaDB, Docker, Stripe, Tailwind CSS e molto altro.",
  "Centotrentasette endpoint API. Diciannove template email. Nove flussi di pagamento. Quattro livelli membership. Carrello cross device. Rimborsi automatici. CINEMA67, la piattaforma completa per il cinema del futuro.",
];

// Use Microsoft Edge TTS (free, no API key)
async function tts(text, outFile) {
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`;
  
  // Use simpler approach: HTTP POST to edge TTS endpoint
  return new Promise((resolve, reject) => {
    const postData = `<speak version='1.0' xml:lang='it-IT'>
      <voice xml:lang='it-IT' name='it-IT-ElsaNeural'>${text}</voice>
    </speak>`;

    const options = {
      hostname: "speech.platform.bing.com",
      path: "/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4",
      method: "POST",
      headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "Mozilla/5.0",
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        fs.writeFileSync(outFile, Buffer.concat(chunks));
        resolve();
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  for (let i = 0; i < narration.length; i++) {
    const file = path.join(audioDir, `scene_${i}.mp3`);
    if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
      console.log(`Skip scene_${i}.mp3 (exists)`);
      continue;
    }
    console.log(`Generating scene_${i}.mp3...`);
    try {
      await tts(narration[i], file);
      console.log(`  Done: scene_${i}.mp3 (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
  console.log("Done!");
}

main();
