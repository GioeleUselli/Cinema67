import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { homeScreenshot } from "./screenshots";

const GOLD = "#b8860b";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const overlayOpacity = interpolate(frame, [0, 20], [1, 0], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame: frame - 5, fps, config: { mass: 0.4, damping: 7 } });
  const textOpacity = interpolate(frame, [12, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <Img src={homeScreenshot} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: `rgba(15,12,9,${overlayOpacity * 0.9})` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
        <div style={{ transform: `scale(${titleScale})`, fontSize: 80, fontWeight: 900, color: GOLD, letterSpacing: 12, fontFamily: "'DM Serif Display', Georgia, serif", textShadow: "0 0 100px rgba(184,134,11,0.4)", opacity: textOpacity }}>CINEMA67</div>
        <div style={{ marginTop: 14, fontSize: 15, color: "#c4b8a8", letterSpacing: 6, textTransform: "uppercase", fontFamily: "'Space Grotesk', Arial, sans-serif", opacity: textOpacity }}>Piattaforma Cinema Completa</div>
        <div style={{ marginTop: 28, fontSize: 17, color: "#8c7b6b", fontFamily: "'Space Grotesk', Arial, sans-serif", textAlign: "center", maxWidth: 560, lineHeight: 1.6, opacity: textOpacity }}>Login social, gestione film, shop, gift card, membership, feste, rimborsi, email e molto altro</div>
        <div style={{ marginTop: 48, padding: "14px 40px", borderRadius: 14, background: `linear-gradient(135deg, ${GOLD}, #92600a)`, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif", opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }) }}>www.cinema67.it</div>
      </div>
    </AbsoluteFill>
  );
};
