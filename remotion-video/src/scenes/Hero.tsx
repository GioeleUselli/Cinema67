import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 45 });
  const subtitleOpacity = interpolate(frame, [25, 55], [0, 1], { extrapolateRight: "clamp" });
  const bgOpacity = interpolate(frame, [20, 80], [0, 0.3], { extrapolateRight: "clamp" });

  const img = getScreenshot("user_home");

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {img && (
        <img
          src={img}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: bgOpacity, zIndex: 0,
          }}
        />
      )}
      <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1
          style={{
            fontSize: 90, fontWeight: 700, color: GOLD,
            fontFamily: "'Playfair Display', 'Georgia', serif",
            margin: 0, letterSpacing: 8, transform: `scale(${scale})`,
          }}
        >
          CINEMA67
        </h1>
        <p
          style={{
            fontSize: 24, color: TEXT, fontFamily: "'Space Grotesk', Arial, sans-serif",
            marginTop: 16, opacity: subtitleOpacity, fontWeight: 300, letterSpacing: 2,
          }}
        >
          La piattaforma completa per il cinema moderno
        </p>
      </div>
      <SubtitleBar text="Tutto cio che serve per gestire un cinema moderno in un'unica piattaforma." />
    </AbsoluteFill>
  );
};

export { Hero };
export default Hero;
