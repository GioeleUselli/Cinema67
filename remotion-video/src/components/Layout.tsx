import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const GOLD = "#d4af37";
export const DARK = "#0a0806";
export const TEXT = "#f0e8e0";
export const MUTED = "#8c7b6b";

export const SubtitleBar: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(0,0,0,0.92))", padding:"28px 60px 22px", opacity: interpolate(frame,[15,35],[0,1],{extrapolateRight:"clamp"}) }}>
      <p style={{ fontSize:22, color:"#c4b8a8", margin:0, fontFamily:"'Space Grotesk',Arial,sans-serif", textAlign:"center", maxWidth:1400, marginLeft:"auto", marginRight:"auto", lineHeight:1.4, fontWeight:500 }}>{text}</p>
    </div>
  );
};

export function getScreenshot(name: string): string {
  try { return require(`../assets/${name}.png`); } catch { return ""; }
}
