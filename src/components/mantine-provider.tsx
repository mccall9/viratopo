"use client";

import { createTheme, MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";

const theme = createTheme({
  primaryColor: "viratopo",
  fontFamily: "DM Sans, Arial, sans-serif",
  headings: { fontFamily: "Nunito, Arial, sans-serif", fontWeight: "400" },
  colors: {
    viratopo: ["#effaf2", "#d9f2e1", "#b4e4c4", "#81d19f", "#4bb877", "#249456", "#0d6a3d", "#095630", "#074425", "#032a16"],
  },
  defaultRadius: "sm",
});

export function ViraTopoProvider({ children }: { children: ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
