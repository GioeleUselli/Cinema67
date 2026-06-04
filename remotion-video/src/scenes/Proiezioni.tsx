import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const SLOTS = ["14:30", "17:00", "20:30", "22:00"];

const DayColumn: React.FC<{ day: string; index: number }> = ({ day, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 30 + index * 8;
  const scale = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 100 }, durationInFrames: 20 });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ transform: `scale(${Math.max(0, scale)})`, opacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 16, color: GOLD, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{day}</p>
      {SLOTS.map((slot) => (
        <div key={slot} style={{
          background: "#1c1814", border: `1px solid ${MUTED}55`, borderRadius: 8,
          padding: "7px 16px", cursor: "default",
        }}>
          <p style={{ margin: 0, fontSize: 14, color: GOLD, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{slot}</p>
        </div>
      ))}
    </div>
  );
};

const Proiezioni: React.FC = () => {
  const img = getScreenshot("admin_proiezioni");

  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ width: "100%", height: "55%", padding: "40px 60px 10px" }}>
        {img && (
          <div style={{ borderRadius: 14, overflow: "hidden", width: "100%", height: "100%", boxShadow: `0 0 30px ${GOLD}1a` }}>
            <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
          </div>
        )}
      </div>
      <div style={{ height: "45%", display: "flex", alignItems: "center", justifyContent: "center", gap: 30, padding: "0 60px 20px" }}>
        {DAYS.map((day, i) => (
          <DayColumn key={day} day={day} index={i} />
        ))}
      </div>
      <SubtitleBar text="Crea la programmazione completa. Sale, orari, prezzi e supplementi in un click." />
    </AbsoluteFill>
  );
};

export { Proiezioni };
export default Proiezioni;
