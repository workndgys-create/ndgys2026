import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "New Delhi Global Youth Summit 4.0";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: 80, background: "#3B1A0A", color: "#FFE8C8", fontFamily: "serif"
        }}
      >
        <div style={{ color: "#D97706", fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>22–23 August 2026 · IIT Delhi</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, marginTop: 24 }}>New Delhi Global</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>Youth <span style={{ color: "#D97706" }}>Summit 4.0</span></div>
        <div style={{ marginTop: 32, fontSize: 30, color: "rgba(247,244,236,0.75)" }}>Eight committees · Diplomacy, climate, technology & enterprise</div>
      </div>
    ),
    { ...size }
  );
}
