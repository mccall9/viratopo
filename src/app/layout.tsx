import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "./viratopo.css";
import { ViraTopoProvider } from "@/components/mantine-provider";

export const metadata: Metadata = {
  title: "ViraTopo — a edição onde produtos disputam espaço",
  description: "Uma edição pública para produtos independentes. Sem métricas inventadas.",
  keywords: ["ranking", "produtos digitais", "pix", "saas", "brasil"],
  openGraph: { title: "ViraTopo — a edição onde produtos disputam espaço", description: "Uma edição pública para produtos independentes. Sem métricas inventadas.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><ViraTopoProvider>{children}</ViraTopoProvider></body></html>;
}
