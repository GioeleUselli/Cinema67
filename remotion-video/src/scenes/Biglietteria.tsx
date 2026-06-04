import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const VerticalStep: React.FC<{ label: string; delay: number; isLast?: boolean }> = ({ label, delay, isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = interpolate(frame, [delay, delay + 16], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${slideY}px)`, opacity }}>
      <div style={{
        background: `linear-gradient(135deg, #1c1814, #2a241e)`,
        border: `1px solid ${GOLD}55`, borderRadius: 10,
        padding: "14px 28px", textAlign: "center", minWidth: 200,
      }}>
        <p style={{ margin: 0, fontSize: 16, color: TEXT, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{label}</p>
      </div>
      {!isLast && (
        <svg width="2" height="28" style={{ margin: "2px 0" }}>
          <line x1="1" y1="0" x2="1" y2="28" stroke={GOLD} strokeWidth="2" strokeDasharray="4 4" opacity={0.6} />
        </svg>
      )}
    </div>
  );
};

const Biglietteria: React.FC = () => {
  const img = getScreenshot("user_programmazione");

  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ display: "flex", height: "100%", padding: "50px 60px 40px", gap: 40 }}>
        <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {img && (
            <div style={{ borderRadius: 14, overflow: "hidden", width: "100%", maxHeight: "85%", boxShadow: `0 0 30px ${GOLD}1a` }}>
              <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
            </div>
          )}
        </div>
        <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
          <VerticalStep label="Seleziona Film" delay={15} />
          <VerticalStep label="Scegli Posto" delay={35} />
          <VerticalStep label="Pagamento" delay={55} />
          <VerticalStep label="QR Code + PDF" delay={75} isLast />
        </div>
      </div>
      <SubtitleBar text="Biglietteria digitale: QR code, PDF automatico, 6 tipi biglietto, codici sconto." />
    </AbsoluteFill>
  );
};

export { Biglietteria };
export default Biglietteria;
