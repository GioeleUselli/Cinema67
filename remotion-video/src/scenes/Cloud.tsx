import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const LAYERS = [
  { label: "Frontend Vanilla JS + Tailwind", color: "#3b82f6" },
  { label: "ASP.NET 9 API", color: "#a78bfa" },
  { label: "MariaDB", color: "#22c55e" },
  { label: "Container Apps", color: "#f59e0b" },
  { label: "Microsoft Azure", color: "#3b82f6" },
];

const LayerBlock: React.FC<{ label: string; color: string; delay: number; index: number }> = ({ label, color, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 25 });
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const widths = [520, 460, 400, 340, 280];
  const width = widths[index];

  return (
    <div style={{
      opacity,
      transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
    }}>
      <div style={{
        width,
        margin: "0 auto",
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `2px solid ${color}66`,
        borderRadius: 10,
        padding: "12px 20px",
        textAlign: "center",
        boxShadow: `0 4px 16px ${color}22`,
      }}>
        <p style={{ margin: 0, fontSize: 14, color, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          {label}
        </p>
      </div>
    </div>
  );
};

const VerticalLine: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <svg width="24" height="32" viewBox="0 0 24 32" style={{ opacity, display: "block", margin: "0 auto" }}>
      <line x1="12" y1="0" x2="12" y2={32 * progress} stroke={GOLD} strokeWidth="2" strokeDasharray="4 3" opacity={0.5} />
    </svg>
  );
};

const Cloud: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {/* Azure cloud icon */}
      <div style={{
        opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        marginBottom: 10,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
        </svg>
      </div>

      {LAYERS.map((layer, i) => (
        <div key={layer.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {i > 0 && <VerticalLine delay={25 + i * 12} />}
          <LayerBlock label={layer.label} color={layer.color} delay={20 + i * 14} index={i} />
        </div>
      ))}

      {/* CI/CD badge */}
      <div style={{
        marginTop: 16,
        background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}08)`,
        border: `1px solid ${GOLD}55`,
        borderRadius: 20,
        padding: "6px 24px",
        opacity: interpolate(frame, [110, 125], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <span style={{ fontSize: 13, color: GOLD, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          CI/CD GitHub Actions
        </span>
      </div>

      <SubtitleBar text="Cloud su Azure. CI/CD GitHub Actions, Container Registry, scaling automatico." />
    </AbsoluteFill>
  );
};

export { Cloud };
export default Cloud;
