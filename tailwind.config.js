const plugin = require("tailwindcss/plugin");

const addAriaAttributes = plugin(({ addVariant }) => {
  const booleans = ["selected"];

  const addAriaVariant = (name, value) => {
    addVariant(name, `[${name}="${value}"]&`);
    addVariant(`peer-${name}`, `:merge(.peer)[${name}="${value}"] ~ &`);
    addVariant(`group-${name}`, `:merge(.group)[${name}="${value}"] &`);
  };

  for (const attribute of booleans) {
    addAriaVariant(`aria-${attribute}`, "true");
  }
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./blocks/**/*.{ts,tsx,jsx,jsx}",
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
    addAriaAttributes,
  ],
};
