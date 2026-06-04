import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";

export const EmailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const emailScale = spring({ frame: frame - 8, fps, config: { mass: 0.4, damping: 8 } });
  const badgesOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });

  const badgeList = [
    { icon: "📧", text: "19 template" },
    { icon: "🌓", text: "Dark/Light mode" },
    { icon: "🔥", text: "Fire-and-forget" },
    { icon: "📬", text: "SMTP securemail" },
    { icon: "🎨", text: "Design brandizzato" },
  ];

  const emailTypes = [
    { emoji: "🎫", label: "Biglietto" },
    { emoji: "🎁", label: "Gift Card" },
    { emoji: "🎉", label: "Festa" },
    { emoji: "👑", label: "Membership" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: BG,
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 80px",
      }}
    >
      {/* Heading */}
      <div style={{ opacity: headingOpacity, textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: GOLD, marginBottom: 4 }}>
          Sistema Email
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: 0 }}>
          Template Brandizzati & Automation
        </h2>
      </div>

      {/* Main content: email preview + feature badges */}
      <div style={{ display: "flex", gap: 50, alignItems: "center" }}>
        {/* Email mockup */}
        <div
          style={{
            transform: `scale(${emailScale})`,
            width: 380,
            background: CARD,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(28,17,8,0.1), 0 2px 8px rgba(28,17,8,0.06)",
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* Dark header */}
          <div
            style={{
              background: "#1a1614",
              padding: "24px 20px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: GOLD,
                letterSpacing: 4,
                fontFamily: "'DM Serif Display', Georgia, serif",
                marginBottom: 4,
              }}
            >
              CINEMA67
            </div>
            <div style={{ color: "#a89888", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Conferma Acquisto
            </div>
          </div>

          {/* White body */}
          <div style={{ padding: "20px", background: "#fffefb" }}>
            {/* Film card */}
            <div
              style={{
                backgroundColor: "#fbf4eb",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 10,
                border: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>🎬</span>
              <div>
                <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                  Film
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                  Inception
                </div>
              </div>
            </div>

            {/* Date & time card */}
            <div
              style={{
                backgroundColor: "#fbf4eb",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 10,
                border: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>📅</span>
              <div>
                <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                  Data e Ora
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                  15 Giugno 2026, 20:30
                </div>
              </div>
            </div>

            {/* Price */}
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                €12.00
              </span>
            </div>

            {/* QR-like code hint */}
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: "#16a34a",
                fontWeight: 600,
              }}
            >
              <span>✅</span> Pagamento confermato
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              background: "#fbf4eb",
              padding: "14px 20px",
              textAlign: "center",
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.5 }}>
              Cinema67 — Il tuo cinema, la tua esperienza.
            </div>
            <div style={{ fontSize: 9, color: BORDER, marginTop: 2 }}>
              www.cinema67.it
            </div>
          </div>
        </div>

        {/* Right side: Feature badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: badgesOpacity }}>
          {badgeList.map((b, i) => (
            <div
              key={b.text}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: CARD,
                border: `1px solid ${BORDER}`,
                fontSize: 13,
                fontWeight: 600,
                color: TEXT,
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 220,
              }}
            >
              <span style={{ fontSize: 20 }}>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>
      </div>

      {/* Email type icons */}
      <div
        style={{
          display: "flex",
          gap: 30,
          marginTop: 24,
          opacity: interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {emailTypes.map((t) => (
          <div key={t.label} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: CARD,
                border: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 2px 8px rgba(28,17,8,0.04)",
              }}
            >
              {t.emoji}
            </div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4, fontWeight: 600 }}>{t.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
