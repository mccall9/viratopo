import type { Metadata } from "next";
import "./globals.css";
import "./arena-pages.css";
import "./sabia-theme.css";
import "./ranking-preview.css";
import "./glass-nav.css";
import "./policy-pages.css";
import "./lance-ui.css";
import "./font-swap.css";
import "./standard-pages.css";

export const metadata: Metadata = {
  title: "ViraTopo — a edição onde produtos disputam espaço",
  description: "Uma edição pública para produtos independentes. Sem métricas inventadas.",
  keywords: ["ranking", "produtos digitais", "pix", "saas", "brasil"],
  openGraph: { title: "ViraTopo — a edição onde produtos disputam espaço", description: "Uma edição pública para produtos independentes. Sem métricas inventadas.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
