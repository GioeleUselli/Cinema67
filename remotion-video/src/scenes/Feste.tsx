import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Cinema67Navbar } from "../components/Layout";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";

export const PartiesRefundsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const card1Slide = spring({ frame: frame - 10, fps, config: { mass: 0.5, damping: 8 } });
  const card2Slide = spring({ frame: frame - 18, fps, config: { mass: 0.5, damping: 8 } });
  const badgesOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  const badgeList = [
    { icon: "🎉", text: "3 tipi evento" },
    { icon: "💎", text: "3 pacchetti" },
    { icon: "🔙", text: "Rimborso automatico" },
    { icon: "💵", text: "Credito + Stripe" },
    { icon: "📊", text: "Storico rimborsi" },
  ];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <Cinema67Navbar activeItem="Feste" />

      <div style={{ padding: "36px 48px", height: "calc(100% - 53px)", display: "flex", flexDirection: "column" }}>
        {/* Heading */}
        <div style={{ opacity: headingOpacity }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: GOLD, marginBottom: 4 }}>
            Feste
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: "0 0 20px" }}>
            Prenotazione & Rimborsi
          </h2>
        </div>

        {/* Party booking cards */}
        <div style={{ flex: 1, display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Card 1: Confirmed booking */}
          <div
            style={{
              transform: `translateY(${(1 - card1Slide) * 30}px)`,
              opacity: card1Slide,
              flex: 1,
              maxWidth: 440,
              background: CARD,
              borderRadius: 16,
              border: `1px solid ${BORDER}`,
              boxShadow: "0 4px 20px rgba(28,17,8,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Card header - green accent */}
            <div
              style={{
                padding: "16px 20px",
                background: `linear-gradient(135deg, #f0fdf4, #dcfce7)`,
                borderBottom: `1px solid #bbf7d0`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Compleanno Marco</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>15 Giugno 2026 · 20:30</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", padding: "4px 12px", borderRadius: 12, background: "#dcfce7" }}>
                ✅ Confermata
              </div>
            </div>
            {/* Card body */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Tipo evento</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>MovieParty</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Pacchetto</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                    Premium
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Ospiti</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>10</div>
                </div>
              </div>
              {/* Price tag */}
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  €149.00
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Cancelled & Refunded */}
          <div
            style={{
              transform: `translateY(${(1 - card2Slide) * 30}px)`,
              opacity: card2Slide,
              flex: 1,
              maxWidth: 440,
              background: CARD,
              borderRadius: 16,
              border: `2px solid ${GOLD}`,
              boxShadow: `0 4px 20px rgba(28,17,8,0.06), 0 0 0 4px ${GOLD}14`,
              overflow: "hidden",
            }}
          >
            {/* Card header - red accent */}
            <div
              style={{
                padding: "16px 20px",
                background: `linear-gradient(135deg, #fef2f2, #fee2e2)`,
                borderBottom: `1px solid #fecaca`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Festa Aziendale</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>20 Giugno 2026 · 19:00</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: RED, padding: "4px 12px", borderRadius: 12, background: "#fee2e2" }}>
                ↩️ Rimborsata
              </div>
            </div>
            {/* Card body */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Tipo evento</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Both (Movie+Game)</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Pacchetto</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                    VIP
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Ospiti</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>30</div>
                </div>
              </div>
              {/* Refund info */}
              <div
                style={{
                  background: "#fefce8",
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: `1px solid #fde68a`,
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "#a16207" }}>Rimborso elaborato</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>su credito + Stripe</span>
              </div>
              {/* Price tag */}
              <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  €550.00 ←
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature badges bar */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 16,
          opacity: badgesOpacity,
        }}
      >
        {badgeList.map((b) => (
          <div
            key={b.text}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              background: CARD,
              border: `1px solid ${BORDER}`,
              fontSize: 11,
              fontWeight: 600,
              color: TEXT,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
