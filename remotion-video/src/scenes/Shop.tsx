import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const FunnelBox: React.FC<{ label: string; index: number }> = ({ label, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 55 + index * 18;
  const slideY = interpolate(frame, [delay, delay + 14], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const widths = [280, 240, 200, 170];
  const width = widths[index];

  return (
    <div style={{ transform: `translateY(${slideY}px)`, opacity, display: "flex", justifyContent: "center" }}>
      <div style={{
        background: `linear-gradient(135deg, #1c1814, #2a241e)`,
        border: `1px solid ${GOLD}55`, borderRadius: 10,
        padding: "10px 0", textAlign: "center", width,
      }}>
        <p style={{ margin: 0, fontSize: 15, color: index === 3 ? GOLD : TEXT, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{label}</p>
      </div>
    </div>
  );
};

const Arrow: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "2px auto" }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const STEPS = ["Prodotti", "Carrello", "Checkout", "Ordine Spedito"];

const Shop: React.FC = () => {
  const img = getScreenshot("user_shop");

  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", padding: "40px 60px 20px" }}>
        {img && (
          <div style={{
            width: "85%", flex: "0 0 55%", borderRadius: 14, overflow: "hidden",
            boxShadow: `0 0 30px ${GOLD}1a`,
          }}>
            <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 20 }}>
          {STEPS.map((step, i) => (
            <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {i > 0 && <Arrow />}
              <FunnelBox label={step} index={i} />
            </div>
          ))}
        </div>
      </div>
      <SubtitleBar text="Shop merchandise ufficiale. Varianti, carrello cross-device, tracking spedizione." />
    </AbsoluteFill>
  );
};

export { Shop };
export default Shop;
