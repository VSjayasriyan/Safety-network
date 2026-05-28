import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ember: "#ff3b1f",
        signal: "#ff8a00",
        graphite: "#12151c",
        rescue: "#00d1b2"
      },
      boxShadow: {
        alert: "0 0 0 1px rgba(255,59,31,.18), 0 18px 60px rgba(255,59,31,.16)"
      }
    }
  },
  plugins: []
};

export default config;
