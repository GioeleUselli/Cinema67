import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

interface Counter {
  value: number;
  suffix: string;
  label: string;
  prefix: string;
}

const COUNTERS: Counter[] = [
  { value: 137, suffix: "+", label: "Endpoint API", prefix: "" },
  { value: 19, suffix: "", label: "Template Email", prefix: "" },
  { value: 9, suffix: "", label: "Flussi di Pagamento", prefix: "" },
  { value: 4, suffix: "", label: "Livelli Membership", prefix: "" },
  { value: 0, suffix: "∞", label: "Possibilità Infinite", prefix: "" },
];

const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [15, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [15, 45], [16, 0], {
    extrapolateRight: "clamp",
  });

  // Counters animate one after another
  const counterAnimations = COUNTERS.map((counter, i) => {
    const counterStart = 35 + i * 30;
    const counterEnd = counterStart + 25;
    const progress = interpolate(frame, [counterStart, counterEnd], [0, 1], {
      extrapolateRight: "clamp",
    });

    const displayValue = Math.round(counter.value * progress);
    const showSuffix = counter.suffix === "∞" ? true : progress >= 1;

    return {
      displayValue,
      showSuffix,
      opacity: interpolate(
        frame,
        [counterStart - 3, counterStart + 8],
        [0, 1],
        { extrapolateRight: "clamp" }
      ),
      scale: spring({
        frame: Math.max(0, frame - counterStart),
        fps,
        config: { mass: 0.4, damping: 8 },
      }),
      finished: progress >= 1,
    };
  });

  const allCountersDone = frame > 35 + COUNTERS.length * 30 + 25;

  const finalTextOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const finalTextY = interpolate(frame, [180, 210], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const finalTextScale = spring({
    frame: Math.max(0, frame - 180),
    fps,
    config: { mass: 0.5, damping: 10 },
  });

  const urlsOpacity = interpolate(frame, [210, 240], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const glowOpacity = interpolate(frame, [160, 210], [0, 0.15], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 50% 45%, ${GOLD}0E 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${GOLD}05 0%, transparent 50%)
          `,
        }}
      />

      {/* Final glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 800,
          height: 800,
          marginLeft: -400,
          marginTop: -400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}44 0%, transparent 55%)`,
          opacity: glowOpacity,
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
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 48,
            color: GOLD,
            fontWeight: 400,
            margin: 0,
          }}
        >
          Cinema67 in Numeri
        </h2>
      </div>

      {/* Counters grid */}
      <div
        style={{
          position: "absolute",
          top: "26%",
          left: "15%",
          right: "15%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {COUNTERS.map((counter, i) => {
          const anim = counterAnimations[i];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                opacity: anim.opacity,
                transform: `scale(${anim.scale})`,
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: counter.suffix === "∞" ? 80 : 72,
                  color: counter.suffix === "∞" ? GOLD : "#f0e8e0",
                  fontWeight: 400,
                  lineHeight: 1,
                  textShadow:
                    counter.suffix === "∞"
                      ? `0 0 40px ${GOLD}66`
                      : `0 0 20px ${GOLD}11`,
                }}
              >
                {counter.suffix === "∞"
                  ? "∞"
                  : `${anim.displayValue}${anim.showSuffix ? counter.suffix : ""}`}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#8c7b6b",
                  textAlign: "center",
                  maxWidth: 140,
                  lineHeight: 1.3,
                }}
              >
                {counter.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Final text */}
      <div
        style={{
          position: "absolute",
          top: "56%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: finalTextOpacity,
          transform: `translateY(${finalTextY}px) scale(${finalTextScale})`,
        }}
      >
        <p
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 38,
            color: GOLD,
            fontWeight: 400,
            margin: 0,
            lineHeight: 1.3,
            textShadow: `0 0 30px ${GOLD}33`,
          }}
        >
          Cinema67: la piattaforma completa
          <br />
          per il cinema del futuro.
        </p>
      </div>

      {/* URLs */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: urlsOpacity,
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 20,
            fontWeight: 400,
            color: "#8c7b6b",
            margin: 0,
            lineHeight: 1.8,
          }}
        >
          www.cinema67.it · api.cinema67.it
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Finale;
