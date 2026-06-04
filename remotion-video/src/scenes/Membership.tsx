import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SectionTitle, FeatureItem, ScreenMockup } from "../components/Layout";

export const MembershipScene: React.FC = () => {
  const frame = useCurrentFrame();
  const tierAnim = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="Membership" subtitle="Carta Fedeltà & Loyalty" />
      <div style={{ display: "flex", gap: 40 }}>
        <ScreenMockup title="Carta Fedeltà Cinema67">
          <div style={{ opacity: tierAnim }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 4 }}>👑</div>
              <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, letterSpacing: 2 }}>TIER GOLD</div>
              <div style={{ fontSize: 11, color: "#a89888" }}>2,340 punti</div>
            </div>
            <div style={{ background: "#1a1614", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#a89888" }}>Progresso Platinum</div>
              <div style={{ height: 6, background: "#38302a", borderRadius: 3, marginTop: 4 }}>
                <div style={{ height: 6, borderRadius: 3, background: "#d4af37", width: "47%" }} />
              </div>
              <div style={{ fontSize: 10, color: "#a89888", marginTop: 2 }}>2,340 / 5,000</div>
            </div>
          </div>
        </ScreenMockup>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          <FeatureItem icon="🏆" text="Tier: Base → Silver → Gold → Platinum" index={0} />
          <FeatureItem icon="✨" text="Accumulo punti automatico" index={1} />
          <FeatureItem icon="🎂" text="Sconto compleanno automatico" index={2} />
          <FeatureItem icon="📰" text="Newsletter auto-subscribe" index={3} />
          <FeatureItem icon="🎫" text="Riscatto premi e sconti" index={4} />
          <FeatureItem icon="🎄" text="Promozioni festive automatiche" index={5} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
