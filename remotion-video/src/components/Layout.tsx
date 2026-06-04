import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

// Real Cinema67 colors
const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";
const SURFACE = "#fbf4eb";

export const Cinema67Navbar: React.FC<{ activeItem?: string }> = ({ activeItem }) => {
  const items = [
    { label: "Cinema", href: "/my-cinemas.html" },
    { label: "Programmazione", href: "/programmazione.html" },
    { label: "Feste", href: "/feste.html" },
    { label: "Shop", href: "/shop.html" },
    { label: "Membership", href: "/membership.html" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 32px",
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: "'Space Grotesk', Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: GOLD,
            letterSpacing: 3,
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}
        >
          CINEMA67
        </span>
        {items.map((item) => (
          <span
            key={item.label}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: item.label === activeItem ? GOLD : MUTED,
              borderBottom: item.label === activeItem ? `2px solid ${GOLD}` : "2px solid transparent",
              padding: "4px 0",
              cursor: "pointer",
            }}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: MUTED }}>Gift Card ▾</span>
        <span
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${GOLD}, #92600a)`,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Accedi
        </span>
      </div>
    </div>
  );
};

export const PageFrame: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const slideY = interpolate(frame, [0, 12], [20, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        background: BG,
        minHeight: "100%",
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        opacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      <div style={{ padding: "40px 60px" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: GOLD,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: TEXT,
              margin: "0 0 24px",
              fontFamily: "'DM Serif Display', Georgia, serif",
            }}
          >
            {subtitle}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export const FeatureCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color?: string;
}> = ({ icon, label, value, color = GOLD }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        flex: 1,
        background: CARD,
        borderRadius: 16,
        border: `1px solid ${BORDER}`,
        padding: "20px",
        textAlign: "center",
        opacity,
      }}
    >
      <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>{icon}</span>
      <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: "'DM Serif Display', Georgia, serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{label}</div>
    </div>
  );
};

export const AnimatedClick: React.FC<{
  targetX: number;
  targetY: number;
  clickFrame: number;
}> = ({ targetX, targetY, clickFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cursorX = interpolate(frame, [0, clickFrame - 10], [50, targetX], { extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [0, clickFrame - 10], [50, targetY], { extrapolateRight: "clamp" });
  const clickScale = spring({ frame: frame - clickFrame, fps, config: { mass: 0.3, damping: 4 } });
  const ringOpacity = interpolate(frame, [clickFrame, clickFrame + 15], [0.8, 0], { extrapolateRight: "clamp" });
  const ringSize = interpolate(frame, [clickFrame, clickFrame + 15], [10, 40], { extrapolateRight: "clamp" });

  return (
    <>
      {/* Click ring */}
      <div
        style={{
          position: "absolute",
          left: targetX - ringSize / 2,
          top: targetY - ringSize / 2,
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          border: `2px solid ${GOLD}`,
          opacity: ringOpacity,
        }}
      />
      {/* Cursor */}
      <div
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          transform: `scale(${1 + clickScale * 0.3})`,
          zIndex: 100,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M4 0L20 16H13L10 19L7 16H0z" fill="#1c1108" stroke={GOLD} strokeWidth="0.5" />
        </svg>
      </div>
    </>
  );
};

export const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ opacity, marginBottom: 30 }}>
      <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 3, fontWeight: 700, marginBottom: 4 }}>
        {title}
      </div>
      {subtitle && (
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#f0e8e0", fontFamily: "'DM Serif Display', Georgia, serif", margin: 0 }}>
          {subtitle}
        </h2>
      )}
    </div>
  );
};

export const ScreenMockup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div
      style={{
        flex: 1,
        background: "#1a1614",
        borderRadius: 14,
        border: "1px solid #2a2520",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: "#0f0c09",
          borderBottom: "1px solid #2a2520",
          color: "#a89888",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
};

export const FeatureItem: React.FC<{ icon: string; text: string; index: number }> = ({ icon, text, index }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [15 + index * 8, 30 + index * 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: "#f0e8e0",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {text}
    </div>
  );
};

export { GOLD, RED, BG, CARD, TEXT, MUTED, BORDER, SURFACE };
