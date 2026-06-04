import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";
const GREEN = "#22c55e";
const RED = "#b91c1c";

const ROWS = 5;
const COLS = 8;

const MappaPosti: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Seats configuration: row 0-1 = occupied, some rows free, row 3 seat 3 is the selected one
  const seats = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      const isOccupied = (row === 0 && col < 4) || (row === 1 && col > 4);
      const isSelected = row === 3 && col === 3;
      return { row, col, isOccupied, isSelected };
    })
  ).flat();

  // Phase timings
  const clickFrame = 10;
  const holdStart = 40;
  const checkoutStart = 80;

  const clickScale = spring({
    frame: Math.max(0, frame - clickFrame),
    fps,
    config: { mass: 0.3, damping: 6 },
  });

  const holdProgress = interpolate(frame, [holdStart, holdStart + 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const checkoutProgress = interpolate(
    frame,
    [checkoutStart, checkoutStart + 30],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Text labels
  const phrase1Opacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const phrase2Opacity = interpolate(frame, [holdStart, holdStart + 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const phrase3Opacity = interpolate(frame, [checkoutStart, checkoutStart + 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const getSeatColor = (isOccupied: boolean, isSelected: boolean) => {
    if (isOccupied) return RED;
    if (isSelected && holdProgress > 0) return GOLD;
    if (isSelected && clickScale > 0) return GOLD;
    return GREEN;
  };

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 800,
          height: 500,
          marginLeft: -400,
          marginTop: -250,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${GOLD}0A 0%, transparent 60%)`,
        }}
      />

      {/* Screen indicator */}
      <div
        style={{
          width: 500,
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD}66 20%, ${GOLD}AA 50%, ${GOLD}66 80%, transparent 100%)`,
          marginBottom: 50,
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
      <span
        style={{
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontSize: 12,
          color: "#6b5a4e",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginTop: -42,
          marginBottom: 36,
          opacity: interpolate(frame, [3, 15], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        schermo
      </span>

      {/* Seat grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {Array.from({ length: ROWS }, (_, row) => (
          <div
            key={row}
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
            }}
          >
            {Array.from({ length: COLS }, (_, col) => {
              const isOccupied =
                (row === 0 && col < 4) || (row === 1 && col > 4);
              const isSelected = row === 3 && col === 3;
              const color = getSeatColor(isOccupied, isSelected);

              const seatDelay = 0;
              const seatOpacity = interpolate(
                frame,
                [seatDelay, seatDelay + 15],
                [0, 1],
                { extrapolateRight: "clamp" }
              );

              return (
                <div
                  key={col}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: color,
                    opacity: seatOpacity,
                    transform: isSelected
                      ? `scale(${1 + clickScale * 0.2})`
                      : "none",
                    boxShadow: isSelected
                      ? `0 0 20px ${color}66, 0 0 40px ${color}22`
                      : `0 0 0 1px ${color}33`,
                    transition: "background 0.1s",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 28,
          marginTop: 40,
        }}
      >
        {[
          { color: GREEN, label: "Disponibile" },
          { color: GOLD, label: "Selezionato" },
          { color: RED, label: "Occupato" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: interpolate(frame, [20 + i * 5, 35 + i * 5], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: item.color,
                boxShadow: `0 0 6px ${item.color}44`,
              }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', Arial, sans-serif",
                fontSize: 12,
                color: "#8c7b6b",
                fontWeight: 500,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Phase text */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 24,
            color: "#f0e8e0",
            margin: 0,
            opacity: phrase1Opacity,
            fontWeight: 600,
          }}
        >
          Selezione posto
        </p>
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 24,
            color: GOLD,
            margin: "8px 0 0",
            opacity: phrase2Opacity,
            fontWeight: 600,
          }}
        >
          Hold 4 minuti
        </p>
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 24,
            color: "#22c55e",
            margin: "8px 0 0",
            opacity: phrase3Opacity,
            fontWeight: 600,
          }}
        >
          Checkout
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default MappaPosti;
