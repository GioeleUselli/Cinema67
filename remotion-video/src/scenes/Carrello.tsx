import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const DeviceFrame: React.FC<{ label: string; width: number; height: number; scale: number; bgOpacity: number; children?: React.ReactNode }> = ({ label, width, height, scale, bgOpacity, children }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${scale})` }}>
    <div style={{
      width, height, background: `linear-gradient(180deg, ${GOLD}22, ${GOLD}08)`,
      border: `2px solid ${GOLD}44`, borderRadius: 14,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${GOLD}15, transparent 70%)`,
        opacity: bgOpacity,
      }} />
      {children}
    </div>
    <p style={{ margin: "10px 0 0", fontSize: 14, color: MUTED, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{label}</p>
  </div>
);

const ProductBadge: React.FC<{ delay: number; device: number }> = ({ delay, device }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const scale = spring({ frame: frame - delay, fps: 24, config: { damping: 10, stiffness: 100 }, durationInFrames: 15 });

  return (
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      transform: `translate(-50%, -50%) scale(${Math.max(0, scale)})`, opacity,
      background: GOLD, borderRadius: 8, padding: "6px 14px",
    }}>
      <p style={{ margin: 0, fontSize: 12, color: DARK, fontWeight: 700, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>POPCORN</p>
    </div>
  );
};

const GlowLine: React.FC<{ fromX: number; toX: number; y: number; delay: number }> = ({ fromX, toX, y, delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const currentX = fromX + (toX - fromX) * progress;
  const opacity = interpolate(frame, [delay, delay + 5], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <svg style={{ position: "absolute", top: y, left: 0, width: "100%", height: 4, overflow: "visible", zIndex: 2, opacity }}>
      <line x1={fromX} y1={0} x2={fromX + (toX - fromX) * progress} y2={0} stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeDasharray="8 4" />
    </svg>
  );
};

const Carrello: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 25 });
  const tabletScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 25 });
  const desktopScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 }, durationInFrames: 25 });

  const bgOp1 = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const bgOp2 = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const bgOp3 = interpolate(frame, [70, 80], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const containerWidth = 900;
  const leftMargin = (1920 - containerWidth) / 2;
  const phoneX = leftMargin + 40;
  const tabletX = leftMargin + 320;
  const desktopX = leftMargin + 600;
  const glowY = 540;

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: containerWidth, height: 500, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        <DeviceFrame label="Smartphone" width={180} height={320} scale={phoneScale} bgOpacity={bgOp1}>
          <ProductBadge delay={30} device={0} />
        </DeviceFrame>
        <DeviceFrame label="Tablet" width={260} height={360} scale={tabletScale} bgOpacity={bgOp2}>
          <ProductBadge delay={50} device={1} />
        </DeviceFrame>
        <DeviceFrame label="Desktop" width={360} height={280} scale={desktopScale} bgOpacity={bgOp3}>
          <ProductBadge delay={70} device={2} />
        </DeviceFrame>

        <GlowLine fromX={phoneX} toX={tabletX} y={glowY} delay={42} />
        <GlowLine fromX={tabletX} toX={desktopX} y={glowY} delay={62} />
      </div>
      <SubtitleBar text="Carrello sincronizzato. Aggiungi da smartphone, ritrovi su desktop e tablet." />
    </AbsoluteFill>
  );
};

export { Carrello };
export default Carrello;
