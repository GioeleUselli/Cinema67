import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const PARTY_CARDS = [
  {
    title: "Basic",
    features: ["Popcorn + Bevande", "1x prezzo"],
    scale: 0.85,
    borderColor: "#6b6b6b",
    bgColor: "#1c1814",
    delay: 30,
  },
  {
    title: "Premium",
    features: ["Torta + Gadget", "1.5x prezzo"],
    scale: 1,
    borderColor: GOLD,
    bgColor: "#2a241e",
    delay: 38,
  },
  {
    title: "VIP",
    features: ["Sala Privata + Catering", "2.5x prezzo"],
    scale: 1.15,
    borderColor: "#b91c1c",
    bgColor: "#2e1a1a",
    delay: 46,
  },
];

const PartyCard: React.FC<{
  title: string;
  features: string[];
  scaleTarget: number;
  borderColor: string;
  bgColor: string;
  delay: number;
}> = ({ title, features, scaleTarget, borderColor, bgColor, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 25 });
  const sc = interpolate(s, [0, 1], [0.3, scaleTarget]);
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      opacity,
      transform: `scale(${Math.max(0.3, sc)})`,
      background: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: 16,
      padding: "24px 32px",
      textAlign: "center",
      minWidth: 190,
      boxShadow: `0 8px 24px ${borderColor}22`,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <p style={{
        margin: 0, fontSize: 22, color: borderColor, fontWeight: 800,
        fontFamily: "'Playfair Display', 'Georgia', serif", letterSpacing: 1,
      }}>
        {title}
      </p>
      <div style={{ width: 40, height: 1, background: borderColor, opacity: 0.4, margin: "0 auto" }} />
      {features.map((f) => (
        <p key={f} style={{ margin: 0, fontSize: 13, color: TEXT, fontWeight: 500, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          {f}
        </p>
      ))}
    </div>
  );
};

const PartyIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L15 9H22L16 14L18 22L12 17L6 22L8 14L2 9H9L12 2Z" />
  </svg>
);

const Eventi: React.FC = () => {
  const img = getScreenshot("user_feste");

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      {img && (
        <div style={{
          width: "60%", borderRadius: 14, overflow: "hidden",
          boxShadow: `0 0 30px ${GOLD}1a`,
          opacity: interpolate(useCurrentFrame(), [5, 25], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, justifyContent: "center" }}>
        {PARTY_CARDS.map((c) => (
          <div key={c.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <PartyIcon color={c.borderColor} />
            <PartyCard
              title={c.title}
              features={c.features}
              scaleTarget={c.scale}
              borderColor={c.borderColor}
              bgColor={c.bgColor}
              delay={c.delay}
            />
          </div>
        ))}
      </div>

      <SubtitleBar text="Eventi privati al cinema. Tre tipi di evento, tre pacchetti, dal Basic al VIP." />
    </AbsoluteFill>
  );
};

export { Eventi };
export default Eventi;
