import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SectionTitle, FeatureItem } from "../components/Layout";

export const AuthScene: React.FC = () => {
  const frame = useCurrentFrame();

  const features = [
    { icon: "📧", text: "Login con email e password" },
    { icon: "🔐", text: "OAuth Google / Microsoft" },
    { icon: "📝", text: "Registrazione con validazione" },
    { icon: "🔄", text: "Refresh token JWT automatico" },
    { icon: "🛡️", text: "Protezione route guard per ruolo" },
    { icon: "📱", text: "SessionStorage per tab isolate" },
  ];

  return (
    <AbsoluteFill style={{ background: "#14100c", padding: "60px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <SectionTitle title="Autenticazione" subtitle="Accesso Multi-provider" />
      <div style={{ display: "flex", gap: 60, marginTop: 20 }}>
        <div>
          {features.slice(0, 3).map((f, i) => (
            <FeatureItem key={i} icon={f.icon} text={f.text} index={i} />
          ))}
        </div>
        <div>
          {features.slice(3).map((f, i) => (
            <FeatureItem key={i} icon={f.icon} text={f.text} index={i + 3} />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 30, opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" }) }}>
        <div style={{ display: "flex", gap: 20 }}>
          <ProviderBadge name="Google" color="#4285F4" />
          <ProviderBadge name="Microsoft" color="#00A4EF" />
          <ProviderBadge name="Email" color="#d4af37" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ProviderBadge: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <div
    style={{
      padding: "12px 28px",
      borderRadius: 12,
      border: `1px solid ${color}44`,
      background: `${color}11`,
      color,
      fontSize: 16,
      fontWeight: 700,
      textAlign: "center",
    }}
  >
    {name}
  </div>
);
