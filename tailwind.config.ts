import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // Dark sidebar
        sidebar: {
          bg: "#0F172A",
          border: "#1E293B",
          text: "#94A3B8",
          "text-active": "#FFFFFF",
          hover: "#1E293B",
          active: "#1E1B4B",
          "active-text": "#A5B4FC",
        },
        // Indigo primary
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          DEFAULT: "#6366F1",
          soft: "#A5B4FC",
          bg: "#EEF2FF",
        },
        // Warm accent
        accent: {
          50: "#FDF8EE",
          100: "#FAF0D7",
          200: "#F5DEB3",
          300: "#E8C987",
          400: "#D4A574",
          500: "#BC8A5F",
          600: "#9B6F4A",
          DEFAULT: "#D4A574",
          soft: "#F5DEB3",
          warm: "#FDF8EE",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
          subtle: "#94A3B8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          tint: "#F8FAFC",
          warm: "#FDF8EE",
          border: "#E2E8F0",
        },
        status: {
          success: "#10B981",
          warn: "#F59E0B",
          crit: "#EF4444",
          info: "#6366F1",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 16px rgba(15, 23, 42, 0.10)",
        pop: "0 4px 12px rgba(99, 102, 241, 0.20)",
      },
    },
  },
  plugins: [],
};

export default config;
