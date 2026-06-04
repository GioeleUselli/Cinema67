import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, getScreenshot, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const LockIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon: React.FC = () => (
  <svg width={18} height={18} viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const AuthCard: React.FC<{ delay: number; bg: string; border: string; children: React.ReactNode }> = ({ delay, bg, border, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideX = interpolate(frame, [delay, delay + 18], [120, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        background: bg, border: `1px solid ${border}`, borderRadius: 10,
        padding: "14px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12,
        transform: `translateX(${slideX}px)`, opacity, backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </div>
  );
};

const Auth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const img = getScreenshot("user_login");

  const leftScale = spring({ frame, fps, config: { damping: 14, stiffness: 70 }, durationInFrames: 35 });

  return (
    <AbsoluteFill style={{ background: DARK }}>
      <div style={{ display: "flex", height: "100%", padding: "60px 60px 40px" }}>
        <div style={{ width: "60%", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 30 }}>
          {img && (
            <div style={{
              borderRadius: 14, overflow: "hidden", boxShadow: `0 0 40px ${GOLD}22`,
              transform: `scale(${leftScale})`, width: "100%", maxHeight: "85%",
            }}>
              <img src={img} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6", borderRadius: 12 }} />
            </div>
          )}
        </div>
        <div style={{ width: "40%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <AuthCard delay={18} bg="#1a1510" border={MUTED}>
            <LockIcon />
            <div>
              <p style={{ margin: 0, fontSize: 16, color: TEXT, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Accesso Email</p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Registrazione con email e password</p>
            </div>
          </AuthCard>
          <AuthCard delay={30} bg="rgba(66,133,244,0.08)" border="#4285F4">
            <GoogleIcon />
            <div>
              <p style={{ margin: 0, fontSize: 16, color: "#4285F4", fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Google OAuth</p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Accedi con il tuo account Google</p>
            </div>
          </AuthCard>
          <AuthCard delay={42} bg="rgba(0,164,239,0.08)" border="#00A4EF">
            <MicrosoftIcon />
            <div>
              <p style={{ margin: 0, fontSize: 16, color: "#00A4EF", fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Microsoft OAuth</p>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Accedi con il tuo account Microsoft</p>
            </div>
          </AuthCard>
        </div>
      </div>
      <SubtitleBar text="Accesso multi-provider con Google, Microsoft ed email. JWT, ruoli e massima sicurezza." />
    </AbsoluteFill>
  );
};

export { Auth };
export default Auth;
