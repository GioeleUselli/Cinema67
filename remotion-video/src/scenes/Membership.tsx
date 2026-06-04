import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Cinema67Navbar } from "../components/Layout";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";

export const MembershipScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({ frame, fps, config: { mass: 0.4, damping: 7 } });
  const progressWidth = interpolate(frame, [15, 40], [0, 47], { extrapolateRight: "clamp" });
  const tiersOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const badgesOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });

  const tiers = [
    { name: "Base", color: "#9ca3af", multiplier: "1x" },
    { name: "Silver", color: "#a8a8a8", multiplier: "1.5x" },
    { name: "Gold", color: "#d4af37", multiplier: "2x", active: true },
    { name: "Platinum", color: "#b91c1c", multiplier: "3x" },
  ];

  const badgeList = [
    { icon: "🏆", text: "Tier progressivo" },
    { icon: "✨", text: "Punti automatici" },
    { icon: "🎂", text: "Sconto compleanno" },
    { icon: "📰", text: "Newsletter auto" },
    { icon: "🎫", text: "Riscatto premi" },
  ];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <Cinema67Navbar activeItem="Membership" />

      <div style={{ padding: "36px 48px", display: "flex", height: "calc(100% - 53px)" }}>
        {/* Left: Membership card */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: GOLD, marginBottom: 4 }}>
            Membership
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: "0 0 20px" }}>
            Carta Fedeltà
          </h2>

          {/* The membership card */}
          <div
            style={{
              transform: `scale(${cardScale})`,
              transformOrigin: "top left",
              width: 420,
              padding: "28px 32px",
              borderRadius: 18,
              background: `linear-gradient(145deg, #ffffff 0%, #fdfaf6 60%, #fbf4eb 100%)`,
              border: `2px solid ${BORDER}`,
              boxShadow: "0 8px 30px rgba(28,17,8,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gold accent stripe */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${GOLD}, #d4af37, ${GOLD})` }} />

            {/* Crown and tier */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 34 }}>👑</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: GOLD, letterSpacing: 2, textTransform: "uppercase" }}>
                    TIER GOLD
                  </div>
                  <div style={{ fontSize: 11, color: MUTED }}>Livello fedeltà</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  2,340
                </div>
                <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Punti</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, ${BORDER}, transparent)` }} />

            {/* Member info */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Titolare</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Marco Rossi</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Card N°</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, fontFamily: "'Courier New', monospace" }}>
                  C67-MEM-123456
                </div>
              </div>
            </div>

            {/* Progress bar to Platinum */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>Progresso Platinum</span>
                <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>47%</span>
              </div>
              <div style={{ height: 8, background: "#ede6db", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progressWidth}%`,
                    background: `linear-gradient(90deg, ${GOLD}, #d4af37, ${GOLD})`,
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ textAlign: "right", marginTop: 2 }}>
                <span style={{ fontSize: 9, color: MUTED }}>2,340 / 5,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tier pills + feature badges */}
        <div style={{ width: 420, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, opacity: tiersOpacity }}>
          {/* Tier pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tiers.map((tier) => (
              <div
                key={tier.name}
                style={{
                  padding: "10px 18px",
                  borderRadius: 22,
                  border: tier.active ? `2px solid ${tier.color}` : `1px solid ${BORDER}`,
                  background: tier.active ? `${tier.color}11` : CARD,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 80,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{tier.name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginTop: 2 }}>{tier.multiplier} punti</div>
              </div>
            ))}
          </div>

          {/* Feature badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {badgeList.map((b, i) => (
              <div
                key={b.text}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: CARD,
                  border: `1px solid ${BORDER}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: TEXT,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                {b.text}
                {b.text === "Tier progressivo" && <span style={{ marginLeft: "auto", fontSize: 10, color: GOLD, fontWeight: 700 }}>Base → Platinum</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom feature badges bar */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
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
              padding: "6px 16px",
              borderRadius: 16,
              background: CARD,
              border: `1px solid ${BORDER}`,
              fontSize: 10,
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
