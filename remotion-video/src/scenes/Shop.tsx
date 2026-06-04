import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SectionTitle, FeatureItem, ScreenMockup } from "../components/Layout";

export const ShopScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="E-Commerce" subtitle="Shop Merchandise & Gift Card" />
      <div style={{ display: "flex", gap: 40 }}>
        <ScreenMockup title="Shop Merch">
          <div style={{ opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }) }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: 10, background: "linear-gradient(135deg, #b91c1c, #d4af37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🍿</div>
              <div style={{ width: 60, height: 60, borderRadius: 10, background: "linear-gradient(135deg, #1a1a2e, #d4af37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👕</div>
              <div style={{ width: 60, height: 60, borderRadius: 10, background: "linear-gradient(135deg, #0f2027, #d4af37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧢</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #2a2520" }}>
              <span style={{ color: "#a89888", fontSize: 12 }}>Carrello</span>
              <span style={{ color: "#d4af37", fontSize: 12, fontWeight: 700 }}>3 articoli · €27.50</span>
            </div>
          </div>
        </ScreenMockup>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
          <FeatureItem icon="🛒" text="Carrello sync cross-device" index={0} />
          <FeatureItem icon="🏷️" text="Codici sconto promozioni" index={1} />
          <FeatureItem icon="💳" text="Pagamento carta/credito" index={2} />
          <FeatureItem icon="🎁" text="Gift Card acquisto & riscatto" index={3} />
          <FeatureItem icon="📦" text="Tracking spedizione merce" index={4} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
