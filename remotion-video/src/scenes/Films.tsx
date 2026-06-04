import React from "react";
import { Slide, SubtitleBar, Card, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Gestione Film" subtitle="Import automatico da TMDB">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center" }}>
            <Card icon="🔍" label="Ricerca TMDB" delay={5} />
            <span style={{ fontSize: 30, color: GOLD }}>→</span>
            <Card icon="📥" label="Import" delay={10} />
            <span style={{ fontSize: 30, color: GOLD }}>→</span>
            <Card icon="🎬" label="Film Aggiunto" delay={15} />
            <span style={{ fontSize: 30, color: GOLD }}>→</span>
            <Card icon="🖼️" label="Poster" delay={20} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <Pill text="Cast" color={GOLD} delay={25} />
            <Pill text="Regista" color={GOLD} delay={29} />
            <Pill text="Durata" color={GOLD} delay={33} />
            <Pill text="Data Rilascio" color={GOLD} delay={37} />
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Importa i film da TMDB con un click. Cast, poster, regista, tutto automatico." />
    </div>
  );
};
export default Scene;
