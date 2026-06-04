import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { CoverSlide, Slide, TechSlide } from "./scenes/Presentation";
import {
  programmazioneScreenshot, loginScreenshot, shopScreenshot, giftcardScreenshot,
  membershipScreenshot, festeScreenshot, homeScreenshot, profiloScreenshot
} from "./scenes/screenshots";

const SLIDE_DURATION = 180; // 6 seconds per slide

const GOLD = "#d4af37";

const slides: Array<{ type: "cover" | "slide" | "tech"; props: Record<string,any> }> = [
  // === COVER ===
  { type: "cover", props: { title: "CINEMA67", subtitle: "Piattaforma Completa per la Gestione del Cinema", details: ["🎬 Gestione Film", "🛒 E-commerce", "👑 Membership", "🔙 Rimborsi"] } },
  
  // === OVERVIEW ===
  { type: "cover", props: { title: "Panoramica", subtitle: "Architettura Full-Stack", details: ["⚡ ASP.NET 9 API", "🎨 Vanilla JS + Tailwind", "🗄️ MariaDB", "☁️ Azure Container Apps"] } },

  // === AUTH ===
  { type: "slide", props: { subtitle: "Autenticazione", title: "Accesso Multi-Provider", screenshot: loginScreenshot, screenshotLabel: "Pagina di login", bullets: [
    "Login email/password con hash BCrypt",
    "Google OAuth 2.0 con verifica email",
    "Microsoft OAuth 2.0 (Azure AD)",
    "Flusso stateless: token via URL, nessun dizionario in memoria",
    "JWT 15min + Refresh token 30 giorni su DB",
    "SessionStorage per sessioni multi-tab isolate",
  ]}},

  // === FILM ===
  { type: "slide", props: { subtitle: "Catalogo", title: "Gestione Film e Programmazione", screenshot: programmazioneScreenshot, screenshotLabel: "Pagina programmazione", reverse: true, bullets: [
    "Import film da TMDB: titolo, cast, poster, descrizione",
    "Creazione proiezioni con mappa posti interattiva",
    "Hold temporaneo posti (4 min) con idempotenza",
    "Sistema recensioni con moderazione admin",
    "QR code univoco per ogni biglietto",
    "Validazione all'ingresso tramite scansione QR",
  ]}},

  // === SHOP ===
  { type: "slide", props: { subtitle: "E-Commerce", title: "Shop Merchandise", screenshot: shopScreenshot, screenshotLabel: "Shop Cinema67", bullets: [
    "Prodotti con immagini multiple e varianti (taglia, colore)",
    "Carrello sincronizzato server-side (cross-device)",
    "Checkout con ritiro al cinema o spedizione",
    "Tracciamento ordini e tracking spedizione",
    "Codici sconto applicabili (MerchDiscountCodes)",
    "Stripe Checkout hosted per pagamento sicuro",
  ]}},

  // === GIFTCARDS ===
  { type: "slide", props: { subtitle: "Gift Card", title: "Gift Card Digitali", screenshot: giftcardScreenshot, screenshotLabel: "Acquisto Gift Card", reverse: true, bullets: [
    "Valori flessibili: €25, €50, €100 o personalizzato",
    "Invio programmato con messaggio personalizzato",
    "Carrello gift card sincronizzato server-side",
    "Riscatto immediato con accredito credito",
    "Codice generato con collision avoidance",
    "Codici sconto applicabili anche alle gift card",
  ]}},

  // === PAYMENTS ===
  { type: "slide", props: { subtitle: "Pagamenti", title: "Stripe Live + PayPal + Credito", screenshot: shopScreenshot, screenshotLabel: "Sistema pagamenti", bullets: [
    "Stripe: chiavi Live, Payment Intent, Checkout Session, Webhook",
    "PayPal: Orders API v2, sandbox con credenziali dedicate",
    "Credito prepagato: ricarica, saldo, storico movimenti",
    "Metodo misto: credito + carta con riserva durante checkout",
    "Idempotency key per prevenire doppi addebiti",
    "Rimborsi automatici e manuali via Stripe/PayPal",
  ]}},

  // === MEMBERSHIP ===
  { type: "slide", props: { subtitle: "Membership", title: "Carta Fedeltà a Tier", screenshot: membershipScreenshot, screenshotLabel: "Carta Fedeltà Cinema67", reverse: true, bullets: [
    "4 livelli: Base → Silver (500pt) → Gold (2000pt) → Platinum (5000pt)",
    "Moltiplicatore punti: 1x, 1.2x, 1.5x, 2x",
    "Accumulo automatico ad ogni acquisto",
    "Catalogo premi riscattabili con punti",
    "Sconto compleanno e promozioni festive automatiche",
    "Newsletter automatica all'attivazione membership",
  ]}},

  // === FESTE ===
  { type: "slide", props: { subtitle: "Eventi", title: "Feste ed Eventi Privati", screenshot: festeScreenshot, screenshotLabel: "Prenotazione Feste", bullets: [
    "3 tipi: MovieParty, GameRoom, Both",
    "3 pacchetti: Basic, Premium, VIP (con moltiplicatore)",
    "Prezzo dinamico: base × ospiti × moltiplicatore",
    "QR code all'ingresso per validazione",
    "Max 2 feste contemporanee per cinema",
    "Rimborso automatico su cancellazione (credito + Stripe)",
  ]}},

  // === REFUNDS ===
  { type: "slide", props: { subtitle: "Rimborsi", title: "Rimborsi Automatici", screenshot: programmazioneScreenshot, screenshotLabel: "Dashboard Rimborsi", reverse: true, bullets: [
    "Cancellazione show con anteprima impatto economico",
    "Rimborso automatico: credito + Stripe per ogni ordine",
    "Revisioni manuali per biglietti già validati",
    "Rimborsi manuali: cerca ordine e rimborsa",
    "Storico completo con stato e importi",
    "Rimborso feste integrato nello stesso sistema",
  ]}},

  // === EMAIL ===
  { type: "slide", props: { subtitle: "Comunicazioni", title: "Sistema Email", screenshot: profiloScreenshot, screenshotLabel: "Template email brandizzati", bullets: [
    "19 template email unificati con design Cinema67",
    "Dark/Light mode automatico (prefers-color-scheme)",
    "Invio fire-and-forget: non blocca i pagamenti",
    "Timeout SMTP 10s con retry automatico",
    "Tipi: biglietti, gift card, feste, membership, rimborsi, tracking",
    "SMTP: authsmtp.securemail.pro:465 SSL",
  ]}},

  // === DEVOPS ===
  { type: "slide", props: { subtitle: "Infrastruttura", title: "DevOps & Cloud", screenshot: homeScreenshot, screenshotLabel: "Architettura Cloud", reverse: true, bullets: [
    "Azure Container Apps: 3 container (API, Web, DB)",
    "CI/CD GitHub Actions: build Docker → push ACR → deploy",
    "Azure File Share: storage persistente per upload media",
    "Custom domain con certificato SSL automatico",
    "Bootstrap database automatico con fallback colonne",
    "Scaling automatico 1-3 repliche",
  ]}},

  // === TECH ===
  { type: "tech", props: {} },

  // === OUTRO ===
  { type: "cover", props: { title: "Grazie", subtitle: "www.cinema67.it · api.cinema67.it", details: ["🎬 137+ Endpoint", "📧 19 Template Email", "💳 9 Flussi Pagamento", "👑 4 Livelli Membership"] } },
];

export const Cinema67Presentation: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#14100c" }}>
      {slides.map((slide, index) => {
        const startFrame = index * SLIDE_DURATION;
        return (
          <Sequence key={index} from={startFrame} durationInFrames={SLIDE_DURATION} name={`Slide${index}`}>
            {slide.type === "cover" && <CoverSlide {...slide.props} />}
            {slide.type === "slide" && <Slide {...slide.props} />}
            {slide.type === "tech" && <TechSlide />}
          </Sequence>
        );
      })}
      <ProgressBar totalFrames={slides.length * SLIDE_DURATION} />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, totalFrames], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#2a2520" }}>
      <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${GOLD}, #b8860b)`, borderRadius: "0 1px 1px 0" }} />
    </div>
  );
};
