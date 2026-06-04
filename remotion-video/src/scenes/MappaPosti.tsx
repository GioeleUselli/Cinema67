import React from "react";
import { Slide, SubtitleBar, GOLD, DARK, TEXT, MUTED } from "../components/Layout";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";

const SeatBlock: React.FC<{ color: string; label: string; status: string; delay: number }> = ({
  color, label, status, delay,
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
        gap: 12,
      }}
    >
      <div
        style={{
          width: 120,
          height: 80,
          borderRadius: 12,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
        }}
      />
      <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: MUTED }}>{status}</div>
    </div>
  );
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Mappa Posti Interattiva" subtitle="Selezione visuale con hold temporaneo">
        <div style={{ display: "flex", gap: 56, alignItems: "center", justifyContent: "center" }}>
          <SeatBlock color="#22c55e" label="Libero" status="Disponibile" delay={5} />
          <SeatBlock color="#d4af37" label="Selezionato" status="Hold 4 min" delay={12} />
          <SeatBlock color="#b91c1c" label="Occupato" status="Venduto" delay={19} />
        </div>
      </Slide>
      <SubtitleBar text="Mappa posti interattiva. L'utente sceglie il posto, scatta l'hold di quattro minuti, checkout completato." />
    </div>
  );
};
export default Scene;
