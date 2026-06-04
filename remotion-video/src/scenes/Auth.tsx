import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { loginScreenshot } from "./screenshots";

const GOLD = "#b8860b";
const RED = "#b91c1c";

export const AuthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const highlightScale = spring({ frame: frame - 20, fps, config: { mass: 0.4, damping: 6 } });
  const callouts = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0f0c09" }}>
      {/* Real login page screenshot */}
      <div style={{ position: "absolute", inset: 0, opacity: imgOpacity }}>
        <Img
          src={loginScreenshot}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6" }}
        />
      </div>

      {/* Animated highlight around Google button */}
      <div
        style={{
          position: "absolute",
          bottom: 310,
          left: "57%",
          transform: `translate(-50%, 0) scale(${highlightScale})`,
          width: 340,
          height: 52,
          borderRadius: 14,
          border: `3px solid ${GOLD}`,
          boxShadow: "0 0 24px rgba(184,134,11,0.4)",
          opacity: interpolate(frame, [20, 30], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Second highlight on Microsoft button */}
      <div
        style={{
          position: "absolute",
          bottom: 248,
          left: "57%",
          transform: `translate(-50%, 0) scale(${spring({ frame: frame - 30, fps, config: { mass: 0.4, damping: 6 } })})`,
          width: 340,
          height: 52,
          borderRadius: 14,
          border: `3px solid #00A4EF`,
          boxShadow: "0 0 24px rgba(0,164,239,0.4)",
          opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Feature badges at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          opacity: callouts,
        }}
      >
        {[
          { icon: "🔐", text: "OAuth Google/Microsoft" },
          { icon: "🔄", text: "JWT + Refresh" },
          { icon: "📱", text: "Sessioni tab isolate" },
          { icon: "🛡️", text: "Route guard per ruolo" },
        ].map((c, i) => (
          <div
            key={c.text}
            style={{
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              borderRadius: 12,
              padding: "10px 18px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: 22 }}>{c.icon}</div>
            <div style={{ fontSize: 10, color: "#c4b8a8", marginTop: 4, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{c.text}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
