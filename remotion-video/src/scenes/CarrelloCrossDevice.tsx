import React from "react";
import { Slide, SubtitleBar, GOLD, DARK, MUTED } from "../components/Layout";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

const DeviceIcon: React.FC<{ icon: string; label: string; delay: number }> = ({
  icon, label, delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame: frame - delay, fps, config: { mass: 0.4, damping: 7 } });
  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 64 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
        {label}
      </div>
    </div>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const syncOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Carrello Cross-Device" subtitle="Sincronizzato su tutti i dispositivi">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
          <div style={{ display: "flex", gap: 64, alignItems: "center", justifyContent: "center" }}>
            <DeviceIcon icon="📱" label="Smartphone" delay={5} />
            <DeviceIcon icon="💻" label="Tablet" delay={12} />
            <DeviceIcon icon="🖥️" label="Desktop" delay={19} />
          </div>
          <div style={{ opacity: syncOpacity }}>
            <p style={{ fontSize: 20, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif", margin: 0 }}>
              Stesso carrello, tutti i dispositivi
            </p>
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Carrello sincronizzato su tutti i dispositivi. Aggiungi da smartphone, ritrovi su desktop." />
    </div>
  );
};
export default Scene;
