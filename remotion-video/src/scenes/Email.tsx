import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const SPOKES = [
  { label: "Conferma\nBiglietti", angle: -90, color: "#22c55e" },
  { label: "Gift Card", angle: -30, color: "#d4af37" },
  { label: "Membership\nAttivata", angle: 30, color: "#a78bfa" },
  { label: "Tracking\nSpedizione", angle: 90, color: "#3b82f6" },
  { label: "Newsletter", angle: 180, color: "#f59e0b" },
];

const CENTER_X = 960;
const CENTER_Y = 420;
const RADIUS = 200;

const Spoke: React.FC<{ label: string; angle: number; color: string; delay: number }> = ({ label, angle, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rad = (angle * Math.PI) / 180;
  const targetX = CENTER_X + RADIUS * Math.cos(rad);
  const targetY = CENTER_Y + RADIUS * Math.sin(rad);

  const progress = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 30 });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <>
      {/* Line */}
      <svg style={{ position: "absolute", top: CENTER_Y, left: CENTER_X, overflow: "visible", opacity, zIndex: 0 }}>
        <line
          x1={0} y1={0}
          x2={RADIUS * 0.85 * Math.cos(rad) * progress}
          y2={RADIUS * 0.85 * Math.sin(rad) * progress}
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity={0.5 * progress}
        />
      </svg>

      {/* Label node */}
      <div style={{
        position: "absolute",
        left: targetX, top: targetY,
        transform: `translate(-50%, -50%) scale(${Math.max(0, progress)})`,
        opacity,
        background: `linear-gradient(135deg, #1c1814, #2a241e)`,
        border: `2px solid ${color}66`,
        borderRadius: 12,
        padding: "12px 20px",
        textAlign: "center",
        boxShadow: `0 4px 16px ${color}22`,
      }}>
        {label.split("\n").map((line, i) => (
          <p key={i} style={{ margin: 0, fontSize: 13, color, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
            {line}
          </p>
        ))}
      </div>
    </>
  );
};

const Email: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: DARK, position: "relative" }}>
      {SPOKES.map((s, i) => (
        <Spoke key={s.label} label={s.label} angle={s.angle} color={s.color} delay={30 + i * 8} />
      ))}

      {/* Center hub */}
      <div style={{
        position: "absolute",
        left: CENTER_X, top: CENTER_Y,
        transform: "translate(-50%, -50%)",
        width: 150, height: 150, borderRadius: "50%",
        background: `radial-gradient(circle, ${GOLD}44, ${GOLD}08)`,
        border: `3px solid ${GOLD}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 5,
        boxShadow: `0 0 40px ${GOLD}44`,
        opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <p style={{ margin: 0, fontSize: 16, color: GOLD, fontWeight: 800, letterSpacing: 2, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          SISTEMA
        </p>
        <p style={{ margin: 0, fontSize: 16, color: GOLD, fontWeight: 800, letterSpacing: 2, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          EMAIL
        </p>
      </div>

      {/* Badge: 19 template */}
      <div style={{
        position: "absolute", top: 60, right: 80,
        background: GOLD, borderRadius: 20, padding: "8px 20px",
        opacity: interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <p style={{ margin: 0, fontSize: 14, color: DARK, fontWeight: 800, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          19 Template
        </p>
      </div>

      <SubtitleBar text="19 template email brandizzati. Dark e light mode. Invio fire-and-forget non bloccante." />
    </AbsoluteFill>
  );
};

export { Email };
export default Email;
