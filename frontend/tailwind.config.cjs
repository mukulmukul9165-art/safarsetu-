/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E8B34B",
        primaryHover: "#D89C2B",
        background: "#F5F1EA",
        secondary: "#FFFDF9",
        surface: "#FFFDF9",
        dark: "#111111",
        foreground: "#111111",
        muted: "#5F5F5F",
        border: "#E5DED3",
        shadow: "rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
}
