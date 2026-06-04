import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const STATS = [
  { label: "Film", value: 248, color: "#d4af37" },
  { label: "Spettacoli", value: 1520, color: "#22c55e" },
  { label: "Utenti", value: 3840, color: "#3b82f6" },
  { label: "Ordini", value: 12750, color: "#a78bfa" },
];

const StatCard: React.FC<{ label: string; value: number; color: string; delay: number }> = ({ label, value, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 25 });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const displayed = interpolate(frame, [delay + 5, delay + 35], [0, value], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      opacity,
      transform: `scale(${Math.max(0, s)})`,
      background: `linear-gradient(135deg, #1c1814, #2a241e)`,
      border: `1px solid ${color}44`,
      borderRadius: 14,
      padding: "16px 28px",
      textAlign: "center",
      minWidth: 170,
    }}>
      <p style={{
        margin: 0, fontSize: 30, fontWeight: 900, color: color,
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        textShadow: `0 0 20px ${color}44`,
      }}>
        {Math.round(displayed).toLocaleString()}+
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 1 }}>
        {label}
      </p>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const img = getScreenshot("admin_dashboard");

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      {img && (
        <div style={{
          width: "75%", borderRadius: 14, overflow: "hidden",
          boxShadow: `0 0 30px ${GOLD}1a`,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
        </div>
      )}

      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {STATS.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} delay={60 + i * 10} />
        ))}
      </div>

      <SubtitleBar text="Dashboard amministratore completa. Monitoraggio in tempo reale di tutta la piattaforma." />
    </AbsoluteFill>
  );
};

export { Dashboard };
export default Dashboard;
