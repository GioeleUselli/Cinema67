import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SectionTitle, FeatureItem, ScreenMockup } from "../components/Layout";

export const PartiesRefundsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="Feste & Rimborsi" subtitle="Prenotazione e Gestione" />
      <div style={{ display: "flex", gap: 40 }}>
        <ScreenMockup title="Feste">
          <div style={{ opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }) }}>
            <div style={{ background: "#1a1614", borderRadius: 8, padding: 12, marginBottom: 10, border: "1px solid #38302a" }}>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700 }}>Compleanno Marco</div>
              <div style={{ color: "#a89888", fontSize: 11 }}>15 Giugno · 10 ospiti · MovieParty · Premium</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>✅ Confermata</span>
                <span style={{ color: "#d4af37", fontSize: 11, fontWeight: 700 }}>€149.00</span>
              </div>
            </div>
            <div style={{ background: "#1a1614", borderRadius: 8, padding: 12, border: "1px solid #d4af37" }}>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700 }}>Festa Aziendale</div>
              <div style={{ color: "#a89888", fontSize: 11 }}>20 Giugno · 30 ospiti · Both · VIP</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ color: "#b91c1c", fontSize: 11, fontWeight: 700 }}>❌ Cancellata — Rimborsata</span>
                <span style={{ color: "#d4af37", fontSize: 11, fontWeight: 700 }}>€550.00 ←</span>
              </div>
            </div>
          </div>
        </ScreenMockup>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          <FeatureItem icon="🎉" text="Prenotazione feste personalizzate" index={0} />
          <FeatureItem icon="📋" text="3 tipi: MovieParty, GameRoom, Both" index={1} />
          <FeatureItem icon="💎" text="3 pacchetti: Basic, Premium, VIP" index={2} />
          <FeatureItem icon="🔙" text="Cancellazione con rimborso automatico" index={3} />
          <FeatureItem icon="💵" text="Rimborso su credito + Stripe" index={4} />
          <FeatureItem icon="📊" text="Storico rimborsi in dashboard admin" index={5} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
