import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  jsxFramework: "react",
  outdir: "styled-system",
  theme: {
    extend: {
      tokens: {
        colors: {
          paper: { value: "#F7F2E9" },
          ink: { value: "#13202A" },
          ember: { value: "#C94B2C" },
          fog: { value: "#E7E0D5" },
          rule: { value: "#C9C0B2" },
        },
        fonts: {
          display: { value: "var(--font-manrope), Arial, sans-serif" },
          body: { value: "var(--font-manrope), Arial, sans-serif" },
          mono: { value: "var(--font-geist-mono), monospace" },
        },
      },
    },
  },
});
