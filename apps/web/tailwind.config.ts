import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "rpg-dark": "#0f0b16",
        "rpg-panel": "#1a1625",
        "rpg-border": "#3b2c5a",
        "rpg-purple": "#8b5cf6",
        "rpg-blue": "#3b82f6",
        "rpg-glow": "#a78bfa",
        "rpg-gold": "#fbbf24",
        "rpg-green": "#34d399",
        "rpg-red": "#f87171",
        "rpg-foreground": "#eaeaf3",
        "rpg-muted": "#8a8498",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      animation: {
        "xp-gain": "xpGain 0.6s ease-out forwards",
        "level-up": "levelUp 1s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        xpGain: {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "100%": { transform: "translateY(-10px)", opacity: "1" },
        },
        levelUp: {
          "0%": { transform: "scale(1)", opacity: "0" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
