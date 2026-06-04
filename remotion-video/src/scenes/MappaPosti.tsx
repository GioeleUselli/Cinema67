import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const ROWS = 8;
const COLS = 12;
const GREEN = "#22c55e";
const GOLD_SEAT = "#d4af37";
const RED = "#b91c1c";

const SEATS_MAP: ("free" | "selected" | "occupied")[][] = [
  ["free","free","free","free","free","free","occupied","occupied","free","free","free","free"],
  ["free","free","free","free","free","free","occupied","occupied","free","free","free","free"],
  ["free","free","free","free","selected","selected","occupied","occupied","free","free","free","free"],
  ["free","free","free","free","free","free","occupied","occupied","free","free","free","free"],
  ["occupied","occupied","free","free","free","free","free","free","free","free","occupied","occupied"],
  ["occupied","occupied","free","free","free","free","free","free","free","free","occupied","occupied"],
  ["free","free","free","free","free","free","free","free","free","free","free","free"],
  ["free","free","free","free","free","free","free","free","free","free","free","free"],
];

const SCREEN = "SCHERMO";

const Seat: React.FC<{ status: "free" | "selected" | "occupied"; row: number; col: number }> = ({ status, row, col }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = row * 5 + col * 2;
  const scale = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 100 }, durationInFrames: 18 });
  const color = status === "free" ? GREEN : status === "selected" ? GOLD_SEAT : RED;

  return (
    <div
      style={{
        width: 36, height: 36, borderRadius: 6,
        background: color,
        transform: `scale(${Math.max(0, scale)})`,
        opacity: Math.min(1, Math.max(0, scale)),
        boxShadow: status === "selected" ? `0 0 16px ${GOLD_SEAT}aa` : "none",
      }}
    />
  );
};

const ProgressionText: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const scale = spring({ frame: frame - delay, fps: 24, config: { damping: 12, stiffness: 90 }, durationInFrames: 18 });
  return (
    <div style={{ opacity, transform: `scale(${Math.max(0, scale)})`, display: "flex", alignItems: "center", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 20, color: TEXT, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{text}</p>
    </div>
  );
};

const ArrowIcon: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const MappaPosti: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "#1c1814", borderRadius: 16, padding: "30px 40px 20px",
        border: `1px solid ${GOLD}33`,
      }}>
        <div style={{
          background: `linear-gradient(180deg, ${GOLD}44, ${GOLD}11)`,
          borderRadius: 6, padding: "8px 0", marginBottom: 20,
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: 4, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{SCREEN}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          {SEATS_MAP.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 6 }}>
              {row.map((status, ci) => (
                <Seat key={`${ri}-${ci}`} status={status} row={ri} col={ci} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
        <ProgressionText text="Clicca per selezionare" delay={60} />
        <ArrowIcon />
        <ProgressionText text="Hold 4 minuti" delay={85} />
        <ArrowIcon />
        <ProgressionText text="Checkout completato" delay={110} />
      </div>

      <SubtitleBar text="Mappa posti interattiva. Selezione visiva con hold temporaneo di quattro minuti." />
    </AbsoluteFill>
  );
};

export { MappaPosti };
export default MappaPosti;
