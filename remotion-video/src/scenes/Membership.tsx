import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const LEVELS = [
  { label: "Base", color: "#6b6b6b", multiplier: "1x" },
  { label: "Silver", color: "#a8a8a8", multiplier: "1.2x" },
  { label: "Gold", color: GOLD, multiplier: "1.5x" },
  { label: "Platinum", color: "#b91c1c", multiplier: "2x" },
];

const SegmentBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barWidth = 600;
  const segW = barWidth / LEVELS.length;
  const startFrame = 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {LEVELS.map((lvl, i) => {
          const d = startFrame + i * 10;
          const scaleX = spring({ frame: frame - d, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 25 });
          const opacity = interpolate(frame, [d, d + 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

          return (
            <div
              key={lvl.label}
              style={{
                width: segW - 6,
                height: 36,
                borderRadius: 8,
                background: lvl.color,
                opacity,
                transform: `scaleX(${Math.max(0, scaleX)})`,
                transformOrigin: "left center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: frame >= d + 20 ? `0 0 20px ${lvl.color}66` : "none",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: lvl.label === "Silver" ? "#1a1a1a" : "#fff", fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
                {lvl.label}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", width: barWidth }}>
        {LEVELS.map((lvl, i) => {
          const d = startFrame + 40 + i * 10;
          const opacity = interpolate(frame, [d, d + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
          return (
            <span key={lvl.label} style={{ fontSize: 15, color: lvl.color, fontWeight: 700, opacity, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
              {lvl.multiplier}
            </span>
          );
        })}
      </div>

      <p style={{
        margin: 0, fontSize: 13, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif",
        opacity: interpolate(frame, [startFrame + 70, startFrame + 85], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        1x &rarr; 1.2x &rarr; 1.5x &rarr; 2x moltiplicatore punti
      </p>
    </div>
  );
};

const Membership: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const img = getScreenshot("user_membership");

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
      {img && (
        <div style={{
          width: "60%", borderRadius: 14, overflow: "hidden",
          boxShadow: `0 0 30px ${GOLD}1a`,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
        </div>
      )}

      <h2 style={{
        margin: 0, fontSize: 36, color: GOLD, fontWeight: 700,
        fontFamily: "'Playfair Display', 'Georgia', serif", letterSpacing: 2,
        opacity: titleOpacity,
      }}>
        Programma Fedelta
      </h2>

      <SegmentBar />

      <SubtitleBar text="Programma fedelta a 4 livelli. Punti automatici, sconto compleanno, promozioni festive." />
    </AbsoluteFill>
  );
};

export { Membership };
export default Membership;
