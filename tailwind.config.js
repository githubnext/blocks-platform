const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  purge: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./blocks/**/*.{ts,tsx,jsx,jsx}",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      spacing: {
        panelHeader: "3em",
      },
      colors: {
        gray: {
          0: "#fafbfc",
          100: "#f6f8fa",
          150: "#EBF0F4",
          200: "#e1e4e8",
          300: "#d1d5da",
          400: "#959da5",
          500: "#6a737d",
          600: "#586069",
          700: "#444d56",
          800: "#2f363d",
          900: "#24292e",
        },
        gh: {
          bg: "#E1E4E8",
          bgDark: "#D0D2D6",
          text: "#24292E",
          textLight: "#586069",
          dark: "#444D56",
          marketingDark: "#050D21",
          marketingButtonText: "#0d1117",
          marketingDarkBg: "#0b0e19",
          "primer-link": "#0969DA",
        },
      },
      transitionProperty: {
        width: "width",
      },
      fontFamily: {
        mona: [
          "Mona Sans",
          "Alliance1",
          "Alliance1Fallback",
          "-apple-system,BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
    },
    screens: {
      ...defaultTheme.screens,
      "3xl": "1900px",
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
  ],
};
