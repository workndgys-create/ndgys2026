import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10112B",      // deep navy base
        midnight: "#1A1A3E", // brand navy
        royal: "#2C2C66",
        gold: "#C9A24B",     // warm gold accent
        goldlite: "#E4C97E",
        cream: "#F7F4EC",    // off-white paper
        paper: "#FBFAF5",
        slatey: "#6B6E8A"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        shimmer: { "100%": { backgroundPosition: "200% center" } }
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        fadeUp: "fadeUp 0.7s ease-out forwards",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        "spin-slow": "spin 15s linear infinite"
      }
    }
  },
  plugins: []
};
export default config;
