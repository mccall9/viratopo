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
          paper: { value: "#FAF9F6" },
          ink: { value: "#271F1B" },
          ember: { value: "#B33F2C" },
          fog: { value: "#F3EFEA" },
          rule: { value: "#D7CDC4" },
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
