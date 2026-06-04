import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SectionTitle, ScreenMockup } from "../components/Layout";

export const AdminScene: React.FC = () => {
  const frame = useCurrentFrame();
  const listOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="Admin Panel" subtitle="Gestione Completa" />
      <div style={{ display: "flex", gap: 40 }}>
        <ScreenMockup title="Dashboard Admin">
          <div style={{ opacity: listOpacity }}>
            <AdminItem icon="🎬" label="Film" desc="Import da TMDB" />
            <AdminItem icon="🎭" label="Registi" desc="Gestione registi" />
            <AdminItem icon="🏛️" label="Cinema" desc="Sale e multisala" />
            <AdminItem icon="📅" label="Proiezioni" desc="Programmazione" />
            <AdminItem icon="🎟️" label="Biglietti" desc="Validazione QR" />
          </div>
        </ScreenMockup>
        <ScreenMockup title="TMDB Import">
          <div style={{ opacity: listOpacity }}>
            <div style={{ background: "#1a1614", borderRadius: 8, padding: 12, marginBottom: 10, border: "1px solid #38302a" }}>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700 }}>Inception</div>
              <div style={{ color: "#a89888", fontSize: 11 }}>2010 · 8.8 ⭐ · 148 min</div>
            </div>
            <div style={{ background: "#1a1614", borderRadius: 8, padding: 12, marginBottom: 10, border: "1px solid #38302a" }}>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700 }}>Interstellar</div>
              <div style={{ color: "#a89888", fontSize: 11 }}>2014 · 8.7 ⭐ · 169 min</div>
            </div>
            <div style={{ background: "#1a1614", borderRadius: 8, padding: 12, border: "1px solid #38302a" }}>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700 }}>The Dark Knight</div>
              <div style={{ color: "#a89888", fontSize: 11 }}>2008 · 9.0 ⭐ · 152 min</div>
            </div>
          </div>
        </ScreenMockup>
      </div>
    </AbsoluteFill>
  );
};

const AdminItem: React.FC<{ icon: string; label: string; desc: string }> = ({ icon, label, desc }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #2a2520" }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <div>
      <div style={{ color: "#f0e8e0", fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#a89888", fontSize: 11 }}>{desc}</div>
    </div>
  </div>
);
