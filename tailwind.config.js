module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
      },
      transitionProperty: {
        width: "width",
      },
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
