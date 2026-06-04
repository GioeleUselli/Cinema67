import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const TIMES = ["14:30", "17:00", "20:30", "22:00"];

const Programmazione: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dayVisibility = DAYS.map((_, i) => {
    const start = 5 + i * 12;
    return {
      opacity: interpolate(frame, [start, start + 12], [0, 1], {
        extrapolateRight: "clamp",
      }),
      y: interpolate(frame, [start, start + 12], [30, 0], {
        extrapolateRight: "clamp",
      }),
    };
  });

  const timesVisibility = TIMES.map((_, i) => {
    const start = 50 + i * 10;
    return interpolate(frame, [start, start + 10], [0, 1], {
      extrapolateRight: "clamp",
    });
  });

  const firstTextOpacity = interpolate(frame, [100, 125], [0, 1], {
    extrapolateRight: "clamp",
  });
  const firstTextY = interpolate(frame, [100, 125], [16, 0], {
    extrapolateRight: "clamp",
  });

  const finalTextOpacity = interpolate(frame, [125, 150], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 1000,
          height: 600,
          marginLeft: -500,
          marginTop: -300,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${GOLD}08 0%, transparent 60%)`,
        }}
      />

      {/* Calendar grid */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
        }}
      >
        {DAYS.map((day, i) => (
          <div
            key={i}
            style={{
              width: 150,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              opacity: dayVisibility[i].opacity,
              transform: `translateY(${dayVisibility[i].y}px)`,
            }}
          >
            {/* Day header */}
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                borderRadius: 10,
                background: i === 3 || i === 4 ? `${GOLD}18` : "#13100b",
                border: i === 3 || i === 4 ? `1px solid ${GOLD}33` : "1px solid #1c1713",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 28,
                  color: i === 3 || i === 4 ? GOLD : "#f0e8e0",
                }}
              >
                {day}
              </span>
            </div>

            {/* Time slots */}
            {TIMES.map((time, t) => {
              const slotOpacity = timesVisibility[t];
              const slotScale = spring({
                frame: Math.max(0, frame - (50 + t * 10)),
                fps,
                config: { mass: 0.2, damping: 5 },
              });
              return (
                <div
                  key={t}
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    borderRadius: 8,
                    background: "#0f0c09",
                    border: "1px solid #1a1510",
                    opacity: slotOpacity,
                    transform: `scale(${slotScale})`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', Arial, sans-serif",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#8c7b6b",
                    }}
                  >
                    {time}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom text section */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 20,
            fontWeight: 500,
            color: "#f0e8e0",
            margin: 0,
            opacity: firstTextOpacity,
            transform: `translateY(${firstTextY}px)`,
          }}
        >
          Sale · Orari · Prezzi · Supplementi
        </p>
        <p
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 28,
            color: GOLD,
            margin: "16px 0 0",
            opacity: finalTextOpacity,
            transform: `translateY(${interpolate(frame, [125, 150], [12, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          Proiezioni pubblicate automaticamente
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Programmazione;
