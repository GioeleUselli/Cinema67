import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const REWARDS = [
  { title: "Biglietti Gratis", subtitle: "Scala 1-8 ingressi", color: "#d4af37", from: "left" },
  { title: "Gift Card", subtitle: "Tagli da 10 a 100 EUR", color: "#d4af37", from: "right" },
  { title: "Merchandise", subtitle: "Articoli esclusivi", color: "#d4af37", from: "left" },
  { title: "Sconti %", subtitle: "5% - 25% su tutto", color: "#d4af37", from: "right" },
];

const Counter: React.FC<{ target: number }> = ({ target = 0 }) => {
  const frame = useCurrentFrame();
  const val = interpolate(frame, [0, 30], [0, target], { extrapolateRight: "clamp" });
  return (
    <span style={{
      fontSize: 72, fontWeight: 900, color: GOLD,
      fontFamily: "'Space Grotesk', Arial, sans-serif",
      textShadow: `0 0 40px ${GOLD}66`,
    }}>
      {Math.round(val).toLocaleString()}
    </span>
  );
};

const RewardCard: React.FC<{ title: string; subtitle: string; color: string; from: string; delay: number; index: number }> = ({ title, subtitle, color, from, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = delay + index * 12;
  const slideX = spring({
    frame: frame - d,
    fps,
    config: { damping: 10, stiffness: 70 },
    durationInFrames: 25,
  });
  const glow = interpolate(frame, [d + 25, d + 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const fromX = from === "left" ? -80 : 80;
  const tx = interpolate(slideX, [0, 1], [fromX, 0]);
  const opacity = interpolate(frame, [d, d + 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      opacity,
      transform: `translateX(${tx}px)`,
      background: `linear-gradient(135deg, #1c1814, #2a241e)`,
      border: `2px solid ${color}${glow > 0.5 ? "aa" : "44"}`,
      borderRadius: 14,
      padding: "16px 28px",
      textAlign: "center",
      minWidth: 180,
      boxShadow: glow > 0 ? `0 0 24px ${color}44` : "none",
      transition: "box-shadow 0.4s",
    }}>
      <p style={{ margin: 0, fontSize: 18, color: color, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{title}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED, fontWeight: 400, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{subtitle}</p>
    </div>
  );
};

const Premi: React.FC = () => {
  const frame = useCurrentFrame();
  const subOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <p style={{ margin: 0, fontSize: 16, color: MUTED, fontWeight: 600, letterSpacing: 4, fontFamily: "'Space Grotesk', Arial, sans-serif", opacity: subOpacity }}>
          PUNTI DISPONIBILI
        </p>
        <Counter target={12450} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", paddingTop: 10 }}>
        {REWARDS.map((r, i) => (
          <RewardCard key={r.title} title={r.title} subtitle={r.subtitle} color={r.color} from={r.from} delay={40} index={i} />
        ))}
      </div>

      <SubtitleBar text="Catalogo premi: riscatta punti per biglietti, gift card, merchandise e sconti esclusivi." />
    </AbsoluteFill>
  );
};

export { Premi };
export default Premi;
