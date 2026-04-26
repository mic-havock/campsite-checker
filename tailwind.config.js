/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        "forest-green": "#2b4c1c",
        moss: "#8b9d77",
        bark: "#4a3b2b",
        earth: "#796957",
        stone: "#a69f98",
        sky: "#b8c5d6",
        sunset: "#d4846a",
        warning: "#d4846a",
        danger: "#963019",
        primary: "#003c1f",
        secondary: "#f4f4f2",
        accent: "#8b4513",
        hover: "#a0522d",
        "background-light": "#f4f4f2",
        "background-dark": "#4a3b2b",
        "text-primary": "#2c3e50",
        "text-light": "#ffffff",
      },
      boxShadow: {
        sm: "0 2px 4px rgba(0, 0, 0, 0.05)",
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        button: "12px",
      },
    },
  },
  plugins: [],
};
