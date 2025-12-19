import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cyber-bg": "#0a0e27",
        "cyber-surface": "#141b3d",
        "cyber-border": "#1e2749",
        "cyber-cyan": "#00f0ff",
        "cyber-green": "#00ff88",
        "cyber-amber": "#ffd700",
        "cyber-red": "#ff0055",
        "cyber-purple": "#b026ff",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "sweep-row": "sweep-row 0.5s ease-out",
        "sweep-col": "sweep-col 0.5s ease-out",
        "bit-flip": "bit-flip 0.6s ease-out",
        "packet-move": "packet-move 2s ease-in-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px currentColor",
            opacity: "1",
          },
          "50%": {
            boxShadow: "0 0 20px currentColor",
            opacity: "0.8",
          },
        },
        "sweep-row": {
          "0%": {
            transform: "scaleX(0)",
            transformOrigin: "left",
          },
          "100%": {
            transform: "scaleX(1)",
            transformOrigin: "left",
          },
        },
        "sweep-col": {
          "0%": {
            transform: "scaleY(0)",
            transformOrigin: "top",
          },
          "100%": {
            transform: "scaleY(1)",
            transformOrigin: "top",
          },
        },
        "bit-flip": {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "packet-move": {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
