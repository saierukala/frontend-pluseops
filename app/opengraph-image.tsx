import { ImageResponse } from "next/og";

export const alt = "PulseOps — Business Operations Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "14px",
            background: "#4F46E5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          P
        </div>
        <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>PulseOps</div>
      </div>
      <div style={{ fontSize: "52px", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
        Business operations,
      </div>
      <div style={{ fontSize: "52px", fontWeight: 800, color: "#4F46E5", lineHeight: 1.1 }}>
        in one coherent product.
      </div>
      <div style={{ marginTop: "20px", fontSize: "20px", color: "#64748b", maxWidth: "780px" }}>
        Catalog · Inventory · Orders · Payments · Analytics · Realtime operations
      </div>
    </div>,
    { ...size }
  );
}
