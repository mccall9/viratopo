import type { Metadata } from "next";
import "./globals.css";
import styles from "./arena-pages.module.css";

void styles;

export const metadata: Metadata = {
  title: "ViraTopo — a edição onde produtos disputam espaço",
  description: "Uma edição pública para produtos independentes. Sem métricas inventadas.",
  keywords: ["ranking", "produtos digitais", "pix", "saas", "brasil"],
  openGraph: { title: "ViraTopo — a edição onde produtos disputam espaço", description: "Uma edição pública para produtos independentes. Sem métricas inventadas.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
