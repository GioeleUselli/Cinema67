import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";

export const PaymentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const stripeScale = spring({ frame: frame - 10, fps, config: { mass: 0.4, damping: 7 } });
  const paypalScale = spring({ frame: frame - 18, fps, config: { mass: 0.4, damping: 7 } });
  const badgesOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  const badgeList = [
    { icon: "💰", text: "Credito prepagato" },
    { icon: "🔄", text: "Rimborsi automatici" },
    { icon: "📊", text: "Storico movimenti" },
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
        padding: "50px 80px",
      }}
    >
      {/* Heading */}
      <div style={{ opacity: headingOpacity, textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: GOLD, marginBottom: 4 }}>
          Pagamenti
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: 0 }}>
          Stripe Live & PayPal Sandbox
        </h2>
      </div>

      {/* Cards side by side */}
      <div style={{ display: "flex", gap: 60, justifyContent: "center", alignItems: "center" }}>
        {/* Stripe Card */}
        <div
          style={{
            transform: `scale(${stripeScale})`,
            width: 280,
            padding: "28px 24px",
            borderRadius: 18,
            background: "linear-gradient(135deg, #635BFF 0%, #4238D7 60%, #362DB5 100%)",
            color: "#fff",
            boxShadow: "0 12px 40px rgba(99,91,255,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background pattern */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Chip */}
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 44, height: 34, borderRadius: 6, background: "linear-gradient(135deg, #ffd700, #e6be00)", position: "relative" }}>
                <div style={{ position: "absolute", top: 4, left: 8, width: 22, height: 14, borderRadius: 2, background: "rgba(0,0,0,0.1)" }} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
              </div>
            </div>

            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, opacity: 0.7, marginBottom: 4 }}>
              Chiave Live
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: 1, marginBottom: 16 }}>
              pk_live_••••
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>Environment</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>LIVE</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>Stripe</div>
            </div>
          </div>
        </div>

        {/* PayPal Card */}
        <div
          style={{
            transform: `scale(${paypalScale})`,
            width: 280,
            padding: "28px 24px",
            borderRadius: 18,
            background: "linear-gradient(135deg, #003087 0%, #0052A3 50%, #009cde 100%)",
            color: "#fff",
            boxShadow: "0 12px 40px rgba(0,48,135,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -40, left: -30, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: "#009cde" }}>Pay</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", color: "#003087" }}>Pal</div>
            </div>

            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, opacity: 0.7, marginBottom: 4 }}>
              Sandbox API
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: 1, marginBottom: 16 }}>
              client_id: A••••
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1 }}>Environment</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>SANDBOX</div>
              </div>
              <div style={{ fontSize: 30 }}>💳</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature badges */}
      <div style={{ display: "flex", gap: 30, marginTop: 40, opacity: badgesOpacity }}>
        {badgeList.map((b) => (
          <div
            key={b.text}
            style={{
              padding: "10px 22px",
              borderRadius: 20,
              background: CARD,
              border: `1px solid ${BORDER}`,
              fontSize: 12,
              fontWeight: 600,
              color: TEXT,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 6px rgba(28,17,8,0.03)",
            }}
          >
            <span style={{ fontSize: 16 }}>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
