import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const EnvelopeIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4L12 13L2 4" />
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const GiftCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const img = getScreenshot("user_giftcard");

  const cardOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cardScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 30 });
  const arrowOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const envelopeOpacity = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ display: "flex", height: "100%", padding: "50px 60px 40px", alignItems: "center", gap: 30 }}>
        <div style={{ flex: "1 1 45%", height: "80%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {img && (
            <div style={{ borderRadius: 14, overflow: "hidden", width: "100%", height: "100%", boxShadow: `0 0 30px ${GOLD}1a` }}>
              <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
            </div>
          )}
        </div>

        <div style={{ flex: "0 0 80px", display: "flex", alignItems: "center", justifyContent: "center", opacity: arrowOpacity }}>
          <ArrowIcon />
        </div>

        <div style={{ flex: "1 1 30%", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, opacity: cardOpacity, transform: `scale(${cardScale})` }}>
          <div style={{
            width: 240, height: 320,
            background: `linear-gradient(135deg, ${GOLD}, #b8960f)`,
            borderRadius: 16, border: `3px dashed ${DARK}66`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: `0 8px 32px ${GOLD}40`,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: "#3a2a00", fontWeight: 700, letterSpacing: 3, fontFamily: "'Space Grotesk', Arial, sans-serif", marginBottom: 8 }}>
              GIFT CARD
            </p>
            <p style={{
              margin: 0, fontSize: 28, color: DARK, fontWeight: 800, fontFamily: "'Playfair Display', 'Georgia', serif",
              letterSpacing: 4, marginBottom: 8,
            }}>
              CINEMA67
            </p>
            <div style={{ width: 80, height: 1, background: "#3a2a00", marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 40, color: DARK, fontWeight: 800, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
              50 EUR
            </p>
          </div>

          <div style={{ opacity: envelopeOpacity }}>
            <EnvelopeIcon size={40} />
          </div>
        </div>
      </div>
      <SubtitleBar text="Gift card digitali. Importi flessibili, invio programmato, riscatto immediato." />
    </AbsoluteFill>
  );
};

export { GiftCard };
export default GiftCard;
