import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const SectionTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const slideY = interpolate(frame, [0, 15], [30, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: 30,
        opacity,
        transform: `translateY(${slideY}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "#d4af37",
          background: "rgba(212,175,55,0.08)",
          padding: "6px 20px",
          borderRadius: 20,
          marginBottom: 14,
          fontFamily: "'Space Grotesk', Arial, sans-serif",
        }}
      >
        {title}
      </div>
      <h2
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#f0e8e0",
          margin: 0,
          fontFamily: "'DM Serif Display', Georgia, serif",
        }}
      >
        {subtitle}
      </h2>
      <div
        style={{
          width: 80,
          height: 2,
          background: "#d4af37",
          margin: "14px auto 0",
        }}
      />
    </div>
  );
};

export const FeatureItem: React.FC<{
  icon: string;
  text: string;
  index: number;
}> = ({ icon, text, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryFrame = 10 + index * 8;
  const opacity = interpolate(frame, [entryFrame, entryFrame + 10], [0, 1], { extrapolateRight: "clamp" });
  const slideX = interpolate(frame, [entryFrame, entryFrame + 10], [40, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `translateX(${slideX}px)`,
        padding: "8px 0",
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span
        style={{
          fontSize: 15,
          color: "#c4b8a8",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const ScreenMockup: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = interpolate(frame, [0, 12], [0.8, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        border: "1px solid #38302a",
        overflow: "hidden",
        background: "#1c1713",
        opacity,
        transform: `scale(${scale})`,
        maxWidth: 500,
        minWidth: 300,
      }}
    >
      <div
        style={{
          background: "#14100c",
          padding: "12px 18px",
          borderBottom: "1px solid #38302a",
          fontSize: 13,
          fontWeight: 700,
          color: "#d4af37",
          letterSpacing: 2,
          fontFamily: "'DM Serif Display', Georgia, serif",
        }}
      >
        {title}
      </div>
      <div style={{ padding: 18, flex: 1 }}>{children}</div>
    </div>
  );
};
