import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#05070B",
          900: "#080A0F",
          800: "#0A0E17",
          700: "#0F141C",
          600: "#171F2C",
        },
      },
    },
  },
  plugins: [],
};

export default config;