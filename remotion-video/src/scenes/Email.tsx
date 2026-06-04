import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SectionTitle, FeatureItem } from "../components/Layout";

export const EmailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const emailOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="Sistema Email" subtitle="Template Brandizzati & Automation" />
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {/* Email mockup */}
        <div
          style={{
            opacity: emailOpacity,
            width: 360,
            background: "#ffffff",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e8e0d5",
          }}
        >
          <div style={{ background: "#1a1614", padding: "24px 20px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#d4af37", letterSpacing: 3, fontFamily: "Georgia, serif" }}>CINEMA67</div>
            <div style={{ color: "#a89888", fontSize: 11, marginTop: 4 }}>Conferma acquisto</div>
          </div>
          <div style={{ padding: 20, background: "#fffefb" }}>
            <div style={{ backgroundColor: "#faf7f3", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #e8e0d5" }}>
              <div style={{ fontSize: 9, color: "#8c7b6b", textTransform: "uppercase", letterSpacing: 1 }}>Film</div>
              <div style={{ fontSize: 13, color: "#1a1614", fontWeight: 600 }}>Inception</div>
            </div>
            <div style={{ backgroundColor: "#faf7f3", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #e8e0d5" }}>
              <div style={{ fontSize: 9, color: "#8c7b6b", textTransform: "uppercase", letterSpacing: 1 }}>Data e ora</div>
              <div style={{ fontSize: 13, color: "#1a1614", fontWeight: 600 }}>15 Giugno 2026, 20:30</div>
            </div>
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <span style={{ color: "#d4af37", fontSize: 18, fontWeight: 900 }}>€12.00</span>
            </div>
          </div>
          <div style={{ background: "#faf7f3", padding: "14px 20px", textAlign: "center", borderTop: "1px solid #e8e0d5" }}>
            <div style={{ color: "#8c7b6b", fontSize: 10 }}>Cinema67 — Il tuo cinema, la tua esperienza.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          <FeatureItem icon="🎨" text="Design brandizzato Cinema67" index={0} />
          <FeatureItem icon="🌓" text="Dark/Light mode automatico" index={1} />
          <FeatureItem icon="📧" text="19 template email unificati" index={2} />
          <FeatureItem icon="🎫" text="Biglietti, Gift Card, Feste" index={3} />
          <FeatureItem icon="🔥" text="Invio fire-and-forget (no blocchi)" index={4} />
          <FeatureItem icon="📬" text="SMTP authsmtp.securemail.pro" index={5} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
