import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { SectionTitle, FeatureItem } from "../components/Layout";

export const PaymentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stripeScale = spring({ frame: frame - 10, fps, config: { mass: 0.4, damping: 6 } });
  const ppScale = spring({ frame: frame - 20, fps, config: { mass: 0.4, damping: 6 } });

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="Pagamenti" subtitle="Stripe Live & PayPal Sandbox" />
      <div style={{ display: "flex", gap: 60, justifyContent: "center", alignItems: "center", marginTop: 20 }}>
        {/* Stripe Card */}
        <div
          style={{
            transform: `scale(${stripeScale})`,
            width: 240,
            padding: 30,
            borderRadius: 20,
            background: "linear-gradient(135deg, #635BFF 0%, #4C43D4 100%)",
            color: "#fff",
            border: "1px solid #ffffff22",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, letterSpacing: 2 }}>Stripe</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Chiave Live</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>pk_live_••••••••</div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <div style={{ width: 40, height: 6, borderRadius: 3, background: "#ffffff44" }}></div>
            <div style={{ width: 40, height: 6, borderRadius: 3, background: "#ffffff44" }}></div>
            <div style={{ width: 40, height: 6, borderRadius: 3, background: "#ffffff44" }}></div>
            <div style={{ width: 20, height: 6, borderRadius: 3, background: "#ffffff44" }}></div>
          </div>
        </div>

        {/* PayPal Card */}
        <div
          style={{
            transform: `scale(${ppScale})`,
            width: 240,
            padding: 30,
            borderRadius: 20,
            background: "linear-gradient(135deg, #003087 0%, #009cde 100%)",
            color: "#fff",
            border: "1px solid #ffffff22",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, letterSpacing: 2 }}>PayPal</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Sandbox API</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>client_id: A••••••</div>
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 30 }}>💳</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 30 }}>
        <FeatureItem icon="💰" text="Sistema credito prepagato" index={0} />
        <FeatureItem icon="🔄" text="Rimborsi automatici" index={1} />
        <FeatureItem icon="📊" text="Storico movimenti" index={2} />
      </div>
    </AbsoluteFill>
  );
};
