import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ── Desi / Indian-heritage palette ──────────────────────────────────
        ink:      "#3B1A0A",   // dark rich brown (main text)
        midnight: "#4A2008",   // deeper brown (darker surfaces)
        royal:    "#6B2D0A",   // terracotta brown
        gold:     "#D97706",   // saffron-amber accent
        goldlite: "#F59E0B",   // bright saffron/marigold
        cream:    "#FFE8C8",   // warm peach-yellow (main bg - from the shared image)
        paper:    "#FFF3D6",   // warm marigold yellow-cream
        slatey:   "#8B6914",   // warm muted brown
        // Extra Indian palette accents (use via arbitrary values)
        // saffron: #FF7722, terracotta: #C1440E, teal: #0E7490, henna: #8B1A1A
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        shimmer: { "100%": { backgroundPosition: "200% center" } },
        rickshaw: { "0%": { transform: "translateX(-120px)" }, "100%": { transform: "translateX(0px)" } },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        fadeUp: "fadeUp 0.7s ease-out forwards",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        "spin-slow": "spin 15s linear infinite",
        rickshaw: "rickshaw 1.2s ease-out forwards",
      }
    }
  },
  plugins: []
};
export default config;
