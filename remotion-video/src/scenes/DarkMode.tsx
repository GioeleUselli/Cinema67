import React from "react";
import { Slide, SubtitleBar, GOLD, DARK, TEXT } from "../components/Layout";
import { useCurrentFrame, interpolate } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Tema Automatico" subtitle="Light e Dark Mode">
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "stretch", justifyContent: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdfaf6", gap: 16 }}>
            <div style={{ fontSize: 48 }}>☀️</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1c1108", fontFamily: "'DM Serif Display', Georgia, serif" }}>Light Mode</div>
          </div>
          <div style={{ width: 3, background: GOLD }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0806", gap: 16 }}>
            <div style={{ fontSize: 48 }}>🌙</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0e8e0", fontFamily: "'DM Serif Display', Georgia, serif" }}>Dark Mode</div>
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Tema automatico. L'app segue le preferenze del dispositivo." />
    </div>
  );
};
export default Scene;
