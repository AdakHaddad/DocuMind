import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: "var(--font-inter)",
        "open-sans": "var(--font-open-sans)",
      },
      colors: {
        documind: {
          primary: "#4a90e2", // Blue primary color
          secondary: "#f0ad4e", // Orange/yellow accent
          bg: "#f8f9fa", // Light background
          text: "#212529", // Dark text
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
