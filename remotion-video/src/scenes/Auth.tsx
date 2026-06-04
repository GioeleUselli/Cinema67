import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Cinema67Navbar } from "../components/Layout";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";

export const AuthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const googleBadge = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });
  const msBadge = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  const callouts = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <Cinema67Navbar />
      <div style={{ display: "flex", height: "calc(100% - 53px)" }}>
        {/* Left cinematic panel */}
        <div
          style={{
            width: "45%",
            background: `linear-gradient(135deg, #1a1614, #0f0c09)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800') center/cover`,
              opacity: 0.12,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>🎬</div>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#f0e8e0",
                fontFamily: "'DM Serif Display', Georgia, serif",
                margin: 0,
              }}
            >
              Bentornato
            </h2>
            <p style={{ color: "#a89888", fontSize: 14, maxWidth: 260, margin: "12px auto 0" }}>
              Il tuo posto in prima fila ti aspetta. Accedi per gestire prenotazioni, profilo e molto altro.
            </p>
            <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 30 }}>
              {["Sicuro 🛡️", "Veloce ⚡", "Premium 👑"].map((t) => (
                <div key={t} style={{ color: GOLD, fontSize: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 24 }}>{t.split(" ")[1]}</div>
                  <div>{t.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right login form */}
        <div style={{ width: "55%", padding: "40px 60px", opacity: formOpacity }}>
          <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 3, fontWeight: 700, marginBottom: 4 }}>
            Accesso
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: "0 0 24px" }}>
            Entra nel tuo account
          </h2>

          {/* Email field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 6 }}>Email</div>
            <div style={{ padding: "14px 18px", borderRadius: 12, background: "#fbf4eb", border: `1px solid ${BORDER}`, color: MUTED, fontSize: 14 }}>
              📧 nome@esempio.com
            </div>
          </div>
          {/* Password field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", marginBottom: 6 }}>Password</div>
            <div style={{ padding: "14px 18px", borderRadius: 12, background: "#fbf4eb", border: `1px solid ${BORDER}`, color: MUTED, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
              <span>🔒 ••••••••</span>
              <span>👁</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 12, color: MUTED }}>
            <label><input type="checkbox" style={{ marginRight: 6 }} />Ricordami</label>
            <span style={{ color: GOLD }}>Password dimenticata?</span>
          </div>

          <div style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, #92600a)`, color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 15 }}>
            Accedi
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ color: MUTED, fontSize: 11, textTransform: "uppercase" }}>oppure</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                opacity: googleBadge,
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: CARD,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: TEXT,
              }}
            >
              <span style={{ color: "#4285F4", marginRight: 8 }}>G</span> Continua con Google
            </div>
            <div
              style={{
                opacity: msBadge,
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${BORDER}`,
                background: CARD,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: TEXT,
              }}
            >
              <span style={{ color: "#00A4EF", marginRight: 8 }}>⊞</span> Continua con Microsoft
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: MUTED }}>
            Non hai un account? <span style={{ color: GOLD, fontWeight: 600 }}>Registrati gratuitamente</span>
          </div>
        </div>
      </div>

      {/* Feature callouts */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 30,
          opacity: callouts,
        }}
      >
        {[
          { icon: "🔐", text: "JWT + Refresh Token" },
          { icon: "🔗", text: "Google & Microsoft OAuth" },
          { icon: "🛡️", text: "Route guard per ruolo" },
          { icon: "📱", text: "Sessioni tab isolate" },
        ].map((c) => (
          <div key={c.text} style={{ textAlign: "center", color: MUTED, fontSize: 11 }}>
            <div style={{ fontSize: 20 }}>{c.icon}</div>
            <div>{c.text}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
