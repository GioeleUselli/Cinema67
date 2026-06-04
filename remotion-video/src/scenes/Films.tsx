import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const ArrowRight: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const FlowBox: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = interpolate(frame, [delay, delay + 16], [40, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div style={{
      background: `linear-gradient(135deg, #1c1814, #2a241e)`,
      border: `1px solid ${GOLD}44`, borderRadius: 10,
      padding: "12px 24px", minWidth: 150, textAlign: "center",
      transform: `translateY(${slideY}px)`, opacity,
    }}>
      <p style={{ margin: 0, fontSize: 15, color: TEXT, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{label}</p>
    </div>
  );
};

const Films: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const img = getScreenshot("user_programmazione");

  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ width: "100%", height: "55%", padding: "50px 60px 20px" }}>
        {img && (
          <div style={{ borderRadius: 14, overflow: "hidden", width: "100%", height: "100%", boxShadow: `0 0 30px ${GOLD}1a` }}>
            <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
          </div>
        )}
      </div>
      <div style={{
        height: "45%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        padding: "0 60px 20px",
      }}>
        <FlowBox label="Ricerca TMDB" delay={25} />
        <ArrowRight />
        <FlowBox label="Import" delay={37} />
        <ArrowRight />
        <FlowBox label="Film Creato" delay={49} />
        <ArrowRight />
        <FlowBox label="Poster Caricato" delay={61} />
      </div>
      <SubtitleBar text="Importa i film da TMDB con un click. Cast, poster, regista e dettagli automatici." />
    </AbsoluteFill>
  );
};

export { Films };
export default Films;
