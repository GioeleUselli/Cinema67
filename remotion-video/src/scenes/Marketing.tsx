import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const PILLS = ["Codici Sconto", "Newsletter", "Promozioni"];

const BroadcastArrow: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <svg width="60" height="24" viewBox="0 0 60 24" style={{ opacity }}>
      <line x1="0" y1="12" x2="54" y2="12" stroke={GOLD} strokeWidth="2.5" />
      <polyline points="46 5 54 12 46 19" fill="none" stroke={GOLD} strokeWidth="2.5" />
    </svg>
  );
};

const UserIcon: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - delay, fps: 24, config: { damping: 10, stiffness: 70 }, durationInFrames: 20 });
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ opacity, transform: `scale(${Math.max(0, s)})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
      </svg>
      <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif", fontWeight: 600 }}>Utenti</span>
    </div>
  );
};

const Pill: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - delay, fps: 24, config: { damping: 10, stiffness: 70 }, durationInFrames: 18 });
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      opacity,
      transform: `scale(${Math.max(0, s)})`,
      background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}08)`,
      border: `1px solid ${GOLD}55`,
      borderRadius: 20,
      padding: "8px 20px",
    }}>
      <span style={{ fontSize: 13, color: GOLD, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
        {label}
      </span>
    </div>
  );
};

const Marketing: React.FC = () => {
  const frame = useCurrentFrame();
  const img = getScreenshot("admin_films");

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      {img && (
        <div style={{
          width: "65%", maxHeight: "30%", borderRadius: 14, overflow: "hidden",
          boxShadow: `0 0 30px ${GOLD}1a`,
          opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
        </div>
      )}

      {/* Broadcast flow */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", paddingTop: 10 }}>
        {/* Admin */}
        <div style={{
          opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" }),
          background: `linear-gradient(135deg, #1c1814, #2a241e)`,
          border: `2px solid ${GOLD}88`,
          borderRadius: 12,
          padding: "14px 24px",
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 16, color: GOLD, fontWeight: 800, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Admin</p>
        </div>

        <BroadcastArrow delay={30} />

        {/* Campagna Card */}
        <div style={{
          opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${Math.max(0, spring({ frame: frame - 30, fps: 24, config: { damping: 10, stiffness: 70 }, durationInFrames: 20 }))})`,
          background: GOLD,
          borderRadius: 12,
          padding: "14px 28px",
          textAlign: "center",
          boxShadow: `0 4px 20px ${GOLD}66`,
        }}>
          <p style={{ margin: 0, fontSize: 16, color: DARK, fontWeight: 800, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Crea Campagna</p>
        </div>

        {/* Fan-out arrows to users */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <BroadcastArrow key={i} delay={48 + i * 4} />
          ))}
        </div>

        {/* Users */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <UserIcon key={i} delay={52 + i * 6} color={GOLD} />
          ))}
        </div>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        {PILLS.map((p, i) => (
          <Pill key={p} label={p} delay={70 + i * 10} />
        ))}
      </div>

      <SubtitleBar text="Marketing integrato. Campagne, codici sconto, promozioni festive e newsletter." />
    </AbsoluteFill>
  );
};

export { Marketing };
export default Marketing;
