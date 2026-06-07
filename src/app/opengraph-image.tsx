import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "New Delhi Global Youth Summit 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "center", padding: 80, background: "#1A1A3E", color: "#F7F4EC", fontFamily: "serif"
        }}
      >
        <div style={{ color: "#C9A24B", fontSize: 28, letterSpacing: 4, textTransform: "uppercase" }}>22–23 August 2026 · IIT Delhi</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, marginTop: 24 }}>New Delhi Global</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>Youth <span style={{ color: "#C9A24B" }}>Summit</span></div>
        <div style={{ marginTop: 32, fontSize: 30, color: "rgba(247,244,236,0.75)" }}>Eight committees · Diplomacy, climate, technology & enterprise</div>
      </div>
    ),
    { ...size }
  );
}
