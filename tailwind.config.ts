import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141411",
        fog: "#f7f8f6",
        moss: "#5a6f4f",
        clay: "#b46044",
        steel: "#4f6472",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20, 20, 17, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
