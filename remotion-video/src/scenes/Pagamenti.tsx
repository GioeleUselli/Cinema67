import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const RADIUS = 180;
const CENTER_X = 960;
const CENTER_Y = 440;

const BranchCard: React.FC<{ label: string; color: string; sublabel?: string; angle: number; delay: number }> = ({ label, color, sublabel, angle, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rad = (angle * Math.PI) / 180;
  const targetX = CENTER_X + RADIUS * Math.cos(rad);
  const targetY = CENTER_Y + RADIUS * Math.sin(rad);

  const progress = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 30 });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      position: "absolute",
      left: targetX, top: targetY,
      transform: `translate(-50%, -50%) scale(${Math.max(0, progress)})`,
      opacity,
      background: color, borderRadius: 14,
      padding: "16px 28px", textAlign: "center",
      boxShadow: `0 4px 20px ${color}44`,
      border: `1px solid ${GOLD}55`,
    }}>
      <p style={{ margin: 0, fontSize: 18, color: "#fff", fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{label}</p>
      {sublabel && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ffffffcc", fontWeight: 400, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{sublabel}</p>}
    </div>
  );
};

const ConnectingLine: React.FC<{ angle: number; delay: number }> = ({ angle, delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 18], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const rad = (angle * Math.PI) / 180;
  const endX = 0.75 * RADIUS * Math.cos(rad);
  const endY = 0.75 * RADIUS * Math.sin(rad);
  const currentX = endX * progress;
  const currentY = endY * progress;
  const opacity = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <svg style={{ position: "absolute", top: CENTER_Y, left: CENTER_X, overflow: "visible", opacity, zIndex: 0 }}>
      <line x1={0} y1={0} x2={currentX} y2={currentY} stroke={GOLD} strokeWidth="2" strokeDasharray="6 4" opacity={0.5} />
    </svg>
  );
};

const Pagamenti: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: DARK, position: "relative" }}>
      <ConnectingLine angle={-90} delay={25} />
      <ConnectingLine angle={0} delay={35} />
      <ConnectingLine angle={90} delay={45} />
      <ConnectingLine angle={180} delay={55} />

      <BranchCard label="Stripe" color="#635BFF" sublabel="Carta di credito" angle={-90} delay={25} />
      <BranchCard label="PayPal" color="#009cde" sublabel="Wallet digitale" angle={0} delay={35} />
      <BranchCard label="Credito" color="#d4af37" sublabel="Prepagato" angle={90} delay={45} />
      <BranchCard label="Misto" color="linear-gradient(135deg, #635BFF 0%, #d4af37 100%)" sublabel="Credito + Carta" angle={180} delay={55} />

      <div style={{
        position: "absolute", left: CENTER_X, top: CENTER_Y,
        transform: "translate(-50%, -50%)",
        width: 130, height: 130, borderRadius: "50%",
        background: `radial-gradient(circle, ${GOLD}33, ${GOLD}08)`,
        border: `3px solid ${GOLD}88`,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 5,
      }}>
        <p style={{ margin: 0, fontSize: 16, color: GOLD, fontWeight: 800, letterSpacing: 3, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>CHECKOUT</p>
      </div>

      <SubtitleBar text="4 metodi di pagamento: Stripe Live, PayPal, Credito prepagato e metodo misto." />
    </AbsoluteFill>
  );
};

export { Pagamenti };
export default Pagamenti;
