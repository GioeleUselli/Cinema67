import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";
const SURFACE = "#14100c";
const TEXT = "#f0e8e0";
const MUTED = "#8c7b6b";

// ============================================================
// Simulated browser window with top bar, URL bar, and content
// ============================================================
export const BrowserFrame: React.FC<{
  url?: string;
  children: React.ReactNode;
  scale?: number;
}> = ({ url = "cinema67.it", children, scale = 1 }) => {
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #2a2520", background: LIGHT_BG, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ background: "#1c1713", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center", background: "#0f0c09", borderRadius: 6, padding: "4px 12px" }}>
            <span style={{ fontSize: 10, color: "#6b5a4e", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{url}</span>
          </div>
        </div>
        <div style={{ background: LIGHT_BG }}>{children}</div>
      </div>
    </div>
  );
};

// ============================================================
// Realistic animated mouse cursor
// ============================================================
export const AnimatedCursor: React.FC<{
  path: Array<{ x: number; y: number; atFrame: number }>;
  clicks?: number[];
}> = ({ path, clicks = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let cx = path[0]?.x ?? 0;
  let cy = path[0]?.y ?? 0;

  for (let i = path.length - 1; i >= 0; i--) {
    if (frame >= path[i].atFrame) {
      if (i < path.length - 1) {
        const next = path[i + 1];
        const progress = interpolate(frame, [path[i].atFrame, next.atFrame], [0, 1], { extrapolateRight: "clamp" });
        cx = interpolate(progress, [0, 1], [path[i].x, next.x]);
        cy = interpolate(progress, [0, 1], [path[i].y, next.y]);
      } else {
        cx = path[i].x;
        cy = path[i].y;
      }
      break;
    }
  }

  const isClicking = clicks.some(c => frame >= c && frame <= c + 10);
  const clickScale = isClicking ? spring({ frame: frame - (clicks.find(c => frame >= c && frame <= c + 10) ?? 0), fps, config: { mass: 0.2, damping: 4 } }) : 0;

  return (
    <div style={{ position: "absolute", left: cx, top: cy, zIndex: 200, pointerEvents: "none" }}>
      {/* Click ring */}
      {isClicking && (
        <div style={{ position: "absolute", left: -10 + clickScale * 15, top: -10 + clickScale * 15, width: 20 + clickScale * 30, height: 20 + clickScale * 30, borderRadius: "50%", border: `1px solid rgba(212,175,55,${1 - clickScale})`, opacity: 1 - clickScale }} />
      )}
      <svg width="22" height="26" viewBox="0 0 22 26" style={{ transform: `scale(${1 + clickScale * 0.15})` }}>
        <path d="M1 1L18 17H11L8 21L5 17H0L1 1Z" fill="#fff" stroke="#1c1108" strokeWidth="0.8" />
      </svg>
    </div>
  );
};

// ============================================================
// Spotlight / light effect
// ============================================================
export const Spotlight: React.FC<{
  x: number;
  y: number;
  radius?: number;
  opacity?: number;
}> = ({ x, y, radius = 400, opacity = 0.15 }) => {
  return (
    <div style={{ position: "absolute", left: x - radius / 2, top: y - radius / 2, width: radius, height: radius, borderRadius: "50%", background: `radial-gradient(circle, ${GOLD}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 0%, transparent 60%)`, pointerEvents: "none", zIndex: 10 }} />
  );
};

// ============================================================
// Animated text with spring and glow
// ============================================================
export const MotionText: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  glow?: boolean;
  centered?: boolean;
}> = ({ text, delay = 0, size = 28, color = TEXT, glow = false, centered = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(frame, [delay, delay + 20], [20, 0], { extrapolateRight: "clamp" });
  const blur = interpolate(frame, [delay, delay + 20], [8, 0], { extrapolateRight: "clamp" });

  return (
    <p style={{
      fontSize: size,
      color,
      fontFamily: "'DM Serif Display', Georgia, serif",
      fontWeight: 700,
      margin: "0 0 12px",
      opacity,
      transform: `translateY(${translateY}px)`,
      filter: `blur(${blur}px)`,
      textShadow: glow ? `0 0 40px ${color}44` : "none",
      textAlign: centered ? "center" : "left",
      lineHeight: 1.3,
    }}>
      {text}
    </p>
  );
};

// ============================================================
// Feature highlight badge
// ============================================================
export const FeatureHighlight: React.FC<{
  icon: string;
  text: string;
  delay: number;
}> = ({ icon, text, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame: frame - delay, fps: useVideoConfig().fps, config: { mass: 0.3, damping: 6 } });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity, transform: `scale(${scale})`, padding: "10px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GOLD}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
      <span style={{ fontSize: 14, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif", fontWeight: 500 }}>{text}</span>
    </div>
  );
};

// ============================================================
// Scene section with fade transition
// ============================================================
export const SceneContainer: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
}> = ({ children, dark = true }) => {
  const frame = useCurrentFrame();
  const bg = dark ? DARK : "#fdfaf6";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      {children}
    </div>
  );
};

// ============================================================
// Grid of floating cards
// ============================================================
export const FloatingCards: React.FC<{
  items: Array<{ title: string; subtitle?: string; icon?: string; color?: string }>;
  delay?: number;
}> = ({ items, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
      {items.map((item, i) => {
        const d = delay + i * 6;
        const opacity = interpolate(frame, [d, d + 15], [0, 1], { extrapolateRight: "clamp" });
        const y = interpolate(frame, [d, d + 15], [30, 0], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{ opacity, transform: `translateY(${y}px)`, padding: "16px 22px", borderRadius: 14, border: `1px solid ${item.color || GOLD}22`, background: `${item.color || GOLD}08`, textAlign: "center", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
            {item.icon && <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>}
            <div style={{ fontSize: 13, fontWeight: 700, color: item.color || GOLD }}>{item.title}</div>
            {item.subtitle && <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{item.subtitle}</div>}
          </div>
        );
      })}
    </div>
  );
};

// Exported constants
const LIGHT_BG = "#fdfaf6";
export { GOLD, DARK, SURFACE, TEXT, MUTED, LIGHT_BG };
