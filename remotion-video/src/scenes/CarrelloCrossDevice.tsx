import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const DEVICES = [
  { icon: "📱", label: "Smartphone" },
  { icon: "💻", label: "Tablet" },
  { icon: "🖥️", label: "PC" },
];

const CarrelloCrossDevice: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: product appears on phone (0-30)
  const bagOnPhone = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  // Phase 2: glowing line phone -> tablet (35-55)
  const linePhoneTablet = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Phase 3: bag moves to tablet (50-70)
  const bagToTablet = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Phase 4: glowing line tablet -> PC (75-95)
  const lineTabletPc = interpolate(frame, [75, 95], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Phase 5: bag moves to PC (90-110)
  const bagToPc = interpolate(frame, [90, 110], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [100, 125], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [100, 125], [16, 0], {
    extrapolateRight: "clamp",
  });

  // Bag position: moves from phone (index 0) to tablet (index 1) to PC (index 2)
  const bagX =
    bagToPc > 0
      ? interpolate(bagToPc, [0, 1], [25, 75])
      : bagToTablet > 0
        ? interpolate(bagToTablet, [0, 1], [0, 50])
        : 0;

  if (bagToPc > 0) {
    // already set
  }

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
            radial-gradient(ellipse at 30% 50%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 70% 50%, ${GOLD}05 0%, transparent 40%)
          `,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
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
          Stesso carrello, tutti i dispositivi
        </h2>
      </div>

      {/* Devices row */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "10%",
          right: "10%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {DEVICES.map((device, i) => {
          const deviceScale = spring({
            frame: Math.max(0, frame - i * 8),
            fps,
            config: { mass: 0.3, damping: 10 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                transform: `scale(${deviceScale})`,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  background: "#13100b",
                  border: `2px solid ${GOLD}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 30px ${GOLD}08`,
                }}
              >
                <span style={{ fontSize: 52 }}>{device.icon}</span>
              </div>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 14,
                  color: "#8c7b6b",
                  fontWeight: 500,
                }}
              >
                {device.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Glowing line phone -> tablet */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Line phone to tablet */}
        <line
          x1="20"
          y1="58"
          x2="48"
          y2="58"
          stroke={GOLD}
          strokeWidth="0.4"
          strokeDasharray="2 1.5"
          opacity={linePhoneTablet}
          style={{
            filter: `drop-shadow(0 0 6px ${GOLD})`,
          }}
        />

        {/* Line tablet to PC */}
        <line
          x1="52"
          y1="58"
          x2="80"
          y2="58"
          stroke={GOLD}
          strokeWidth="0.4"
          strokeDasharray="2 1.5"
          opacity={lineTabletPc}
          style={{
            filter: `drop-shadow(0 0 6px ${GOLD})`,
          }}
        />
      </svg>

      {/* Moving bag 🛒 */}
      <div
        style={{
          position: "absolute",
          top: "53%",
          left: `calc(10% + 60px + (${bagToPc > 0 ? interpolate(bagToPc, [0, 1], [50, 100]) : bagToTablet > 0 ? interpolate(bagToTablet, [0, 1], [0, 50]) : 0} * ((100% - 20%) / 100)) * 0.5)`,
          transform: `translate(-50%, -50%) scale(${bagOnPhone})`,
          opacity: bagOnPhone,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 36 }}>🛒</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 20,
            fontWeight: 400,
            color: "#8c7b6b",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Aggiungi da smartphone, ritrovi su desktop
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default CarrelloCrossDevice;
