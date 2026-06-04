import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";
const LIGHT_BG = "#fdfaf6";

const DarkMode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Divider position: slides from left to right
  const dividerX = interpolate(frame, [30, 120], [20, 80], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // The "reveal" of dark side
  const darkReveal = interpolate(frame, [30, 120], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Card spring on light side
  const lightCardScale = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  // Card spring on dark side
  const darkCardScale = spring({
    frame: Math.max(0, frame - 45),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  const bottomTextOpacity = interpolate(frame, [115, 138], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [115, 138], [12, 0], {
    extrapolateRight: "clamp",
  });

  // Glow pulse on divider
  const dividerGlow = Math.sin(frame * 0.15) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
      }}
    >
      {/* Light side background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: LIGHT_BG,
          clipPath: `inset(0 ${100 - dividerX}% 0 0)`,
        }}
      >
        {/* Light side inner scene */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transform: `scale(${lightCardScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Mini card */}
            <div
              style={{
                padding: "24px 40px",
                borderRadius: 16,
                background: "#ffffff",
                border: `2px solid ${GOLD}44`,
                boxShadow: `0 4px 30px rgba(0,0,0,0.06)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 24,
                  color: GOLD,
                  fontWeight: 400,
                }}
              >
                CINEMA67
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', Arial, sans-serif",
                fontSize: 13,
                color: "#5c4b3b",
                fontWeight: 400,
              }}
            >
              Tema Chiaro
            </span>
          </div>
        </div>
      </div>

      {/* Dark side background (revealed) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: DARK,
          clipPath: `inset(0 0 0 ${dividerX}%)`,
        }}
      >
        {/* Dark side inner scene */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              transform: `scale(${darkCardScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              opacity: darkReveal,
            }}
          >
            {/* Mini card */}
            <div
              style={{
                padding: "24px 40px",
                borderRadius: 16,
                background: "#13100b",
                border: `2px solid ${GOLD}44`,
                boxShadow: `0 0 30px ${GOLD}0C`,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 24,
                  color: GOLD,
                  fontWeight: 400,
                }}
              >
                CINEMA67
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', Arial, sans-serif",
                fontSize: 13,
                color: "#8c7b6b",
                fontWeight: 400,
              }}
            >
              Tema Scuro
            </span>
          </div>
        </div>
      </div>

      {/* Moving divider */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${dividerX}%`,
          width: 4,
          background: GOLD,
          transform: "translateX(-50%)",
          boxShadow: `0 0 ${12 * dividerGlow}px ${GOLD}, 0 0 ${30 * dividerGlow}px ${GOLD}44`,
          zIndex: 20,
          borderRadius: 2,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          zIndex: 10,
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 48,
            color: GOLD,
            fontWeight: 400,
            margin: 0,
            textShadow: `0 0 20px ${DARK}44`,
          }}
        >
          Dark &amp; Light Mode
        </h2>
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: bottomTextOpacity,
          transform: `translateY(${bottomTextY}px)`,
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 18,
            fontWeight: 400,
            color: "#8c7b6b",
            margin: 0,
            textShadow: `0 0 12px ${DARK}88`,
          }}
        >
          Tema automatico — segue le preferenze del dispositivo
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default DarkMode;
