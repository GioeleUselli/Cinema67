import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Cinema67Navbar } from "../components/Layout";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const CARD = "#ffffff";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const BORDER = "#d9cdbd";

export const ShopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gridOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });
  const cartSlide = spring({ frame: frame - 25, fps, config: { mass: 0.5, damping: 10 } });
  const badgesOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });

  const products = [
    { emoji: "🍿", name: "Popcorn", price: "€4.50" },
    { emoji: "👕", name: "T-Shirt Cinema67", price: "€19.99" },
    { emoji: "🧢", name: "Cappellino", price: "€14.99" },
    { emoji: "🖼️", name: "Poster", price: "€9.99" },
  ];

  const badgeList = [
    { icon: "🔄", text: "Carrello sync cross-device" },
    { icon: "🏷️", text: "Codici sconto" },
    { icon: "💳", text: "Pagamento carta/credito" },
    { icon: "🎁", text: "Gift Card acquisto" },
  ];

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
      <Cinema67Navbar activeItem="Shop" />

      <div style={{ padding: "36px 48px", display: "flex", gap: 0, height: "calc(100% - 53px)", position: "relative" }}>
        {/* Main content area */}
        <div style={{ flex: 1, opacity: gridOpacity }}>
          {/* Page heading */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: GOLD, marginBottom: 4 }}>
            Shop
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: "0 0 20px" }}>
            Merchandise Ufficiale
          </h2>

          {/* 4-column product grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, maxWidth: 700 }}>
            {products.map((p, i) => (
              <div
                key={p.name}
                style={{
                  background: CARD,
                  borderRadius: 14,
                  border: `1px solid ${BORDER}`,
                  padding: "20px 14px 14px",
                  textAlign: "center",
                  boxShadow: "0 2px 12px rgba(28,17,8,0.04)",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>{p.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  {p.price}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${GOLD}, #92600a)`,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Aggiungi
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart sidebar - slides in from right */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 280,
            transform: `translateX(${(1 - cartSlide) * 280}px)`,
            background: CARD,
            borderLeft: `1px solid ${BORDER}`,
            boxShadow: "-4px 0 20px rgba(28,17,8,0.06)",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: GOLD, marginBottom: 4 }}>
            Carrello
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: TEXT, fontFamily: "'DM Serif Display', Georgia, serif", margin: "0 0 16px" }}>
            3 articoli
          </h3>

          {/* Cart items */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { emoji: "🍿", name: "Popcorn", qty: "x2", price: "€9.00" },
              { emoji: "👕", name: "T-Shirt", qty: "x1", price: "€12.50" },
              { emoji: "🧢", name: "Cappellino", qty: "x1", price: "€6.00" },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "#fbf4eb",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <span style={{ fontSize: 22 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: MUTED }}>{item.qty}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{item.price}</div>
              </div>
            ))}
          </div>

          {/* Cart footer */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: MUTED }}>Totale</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>
                €27.50
              </span>
            </div>
            <div
              style={{
                padding: "12px",
                borderRadius: 10,
                background: `linear-gradient(135deg, ${GOLD}, #92600a)`,
                color: "#fff",
                textAlign: "center",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Acquista
            </div>
          </div>
        </div>
      </div>

      {/* Feature badges bar */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 20,
          opacity: badgesOpacity,
        }}
      >
        {badgeList.map((b) => (
          <div
            key={b.text}
            style={{
              padding: "8px 18px",
              borderRadius: 20,
              background: CARD,
              border: `1px solid ${BORDER}`,
              fontSize: 11,
              fontWeight: 600,
              color: TEXT,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
