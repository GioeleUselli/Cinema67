import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const FLOW = [
  { label: "Show Cancellato", color: "#ef4444", row: 0, col: 0 },
  { label: "Rimborso Automatico", color: GOLD, row: 0, col: 2 },
  { label: "Credito Utente", color: "#22c55e", row: 2, col: 1 },
  { label: "Rimborso Stripe", color: "#3b82f6", row: 2, col: 3 },
  { label: "Email Inviata", color: TEXT, row: 4, col: 2 },
];

const FlowBox: React.FC<{ label: string; color: string; delay: number; style?: React.CSSProperties }> = ({ label, color, delay, style: extraStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 18 });
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const glow = interpolate(frame, [delay + 18, delay + 28], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      ...extraStyle,
      opacity,
      transform: `scale(${Math.max(0, s)})`,
      background: `linear-gradient(135deg, #1c1814, #2a241e)`,
      border: `2px solid ${color}${glow > 0.5 ? "aa" : "44"}`,
      borderRadius: 12,
      padding: "10px 22px",
      textAlign: "center",
      boxShadow: glow > 0 ? `0 0 16px ${color}44` : "none",
    }}>
      <p style={{ margin: 0, fontSize: 14, color, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{label}</p>
    </div>
  );
};

const ArrowSvg: React.FC<{ dir: "right" | "down"; delay: number }> = ({ dir, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  if (dir === "right") {
    return (
      <svg width="40" height="24" viewBox="0 0 40 24" style={{ opacity }}>
        <line x1="4" y1="12" x2="34" y2="12" stroke={GOLD} strokeWidth="2" strokeDasharray="4 3" opacity={0.6} />
        <polyline points="28 6 34 12 28 18" fill="none" stroke={GOLD} strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg width="24" height="40" viewBox="0 0 24 40" style={{ opacity }}>
      <line x1="12" y1="4" x2="12" y2="34" stroke={GOLD} strokeWidth="2" strokeDasharray="4 3" opacity={0.6} />
      <polyline points="6 28 12 34 18 28" fill="none" stroke={GOLD} strokeWidth="2" />
    </svg>
  );
};

const Rimborsi: React.FC = () => {
  const frame = useCurrentFrame();
  const img = getScreenshot("admin_rimborsi");

  const GRID_COL_W = 180;
  const GRID_ROW_H = 70;
  const OFFSET_X = 750;
  const OFFSET_Y = 340;

  const positions: Record<string, { x: number; y: number }> = {
    "Show Cancellato": { x: OFFSET_X + 0 * GRID_COL_W, y: OFFSET_Y + 0 * GRID_ROW_H },
    "Rimborso Automatico": { x: OFFSET_X + 1.8 * GRID_COL_W, y: OFFSET_Y + 0 * GRID_ROW_H },
    "Credito Utente": { x: OFFSET_X + 0.5 * GRID_COL_W, y: OFFSET_Y + 1.5 * GRID_ROW_H },
    "Rimborso Stripe": { x: OFFSET_X + 3 * GRID_COL_W, y: OFFSET_Y + 1.5 * GRID_ROW_H },
    "Email Inviata": { x: OFFSET_X + 1.8 * GRID_COL_W, y: OFFSET_Y + 3 * GRID_ROW_H },
  };

  const delays: Record<string, number> = {
    "Show Cancellato": 15,
    "Rimborso Automatico": 30,
    "Credito Utente": 50,
    "Rimborso Stripe": 65,
    "Email Inviata": 85,
  };

  return (
    <AbsoluteFill style={{ background: DARK, position: "relative", overflow: "hidden" }}>
      {img && (
        <div style={{
          position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)",
          width: "75%", height: "55%", borderRadius: 14, overflow: "hidden",
          boxShadow: `0 0 30px ${GOLD}1a`,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
        {/* Arrows */}
        <div style={{ position: "absolute", left: positions["Show Cancellato"].x + 90, top: positions["Show Cancellato"].y + 14 }}><ArrowSvg dir="right" delay={40} /></div>
        <div style={{ position: "absolute", left: positions["Rimborso Automatico"].x + 40, top: positions["Rimborso Automatico"].y + 30 }}><ArrowSvg dir="down" delay={55} /></div>
        <div style={{ position: "absolute", left: positions["Rimborso Automatico"].x + 40, top: positions["Rimborso Automatico"].y + 30 }}><ArrowSvg dir="down" delay={70} /></div>
        <div style={{ position: "absolute", left: positions["Credito Utente"].x + 40, top: positions["Credito Utente"].y + 30 }}><ArrowSvg dir="down" delay={90} /></div>
        <div style={{ position: "absolute", left: positions["Rimborso Stripe"].x + 40, top: positions["Rimborso Stripe"].y + 30 }}><ArrowSvg dir="down" delay={90} /></div>

        {FLOW.map((item) => {
          const pos = positions[item.label];
          return (
            <div key={item.label} style={{ position: "absolute", left: pos.x, top: pos.y }}>
              <FlowBox label={item.label} color={item.color} delay={delays[item.label]} />
            </div>
          );
        })}
      </div>

      <SubtitleBar text="Rimborsi automatici. Show cancellato? Rimborso su credito e carta. Dashboard unificata." />
    </AbsoluteFill>
  );
};

export { Rimborsi };
export default Rimborsi;
