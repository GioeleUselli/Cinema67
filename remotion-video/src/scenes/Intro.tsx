import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { homeScreenshot } from "./screenshots";

const GOLD = "#b8860b";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overlayOpacity = interpolate(frame, [0, 20], [1, 0], { extrapolateRight: "clamp" });
  const titleScale = spring({ frame: frame - 5, fps, config: { mass: 0.4, damping: 7 } });
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: "clamp" });
  const btnOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Real homepage screenshot */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.6 }}>
        <Img src={homeScreenshot} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, rgba(15,12,9,${overlayOpacity * 0.9}) 0%, rgba(15,12,9,${overlayOpacity * 0.85}) 100%)`,
        }}
      />

      {/* Spotlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}15 0%, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            transform: `scale(${titleScale})`,
            fontSize: 80,
            fontWeight: 900,
            color: GOLD,
            letterSpacing: 12,
            fontFamily: "'DM Serif Display', Georgia, serif",
            textShadow: "0 0 100px rgba(184,134,11,0.4)",
            opacity: titleOpacity,
          }}
        >
          CINEMA67
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 15,
            color: "#c4b8a8",
            letterSpacing: 6,
            textTransform: "uppercase",
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            opacity: subtitleOpacity,
          }}
        >
          Piattaforma Cinema Completa
        </div>

        <div
          style={{
            marginTop: 28,
            opacity: subtitleOpacity,
            fontSize: 17,
            color: "#8c7b6b",
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            textAlign: "center",
            maxWidth: 580,
            lineHeight: 1.6,
          }}
        >
          Dalla vendita biglietti al rimborso automatico.<br />
          Shop, gift card, membership, feste, newsletter.
        </div>

        <div
          style={{
            marginTop: 44,
            opacity: btnOpacity,
            padding: "16px 44px",
            borderRadius: 14,
            background: `linear-gradient(135deg, ${GOLD}, #92600a)`,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            boxShadow: "0 8px 32px rgba(184,134,11,0.2)",
          }}
        >
          Esplora le funzionalità ▼
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
            fontSize: 22,
            color: GOLD,
          }}
        >
          www.cinema67.it
        </div>
      </div>
    </AbsoluteFill>
  );
};
