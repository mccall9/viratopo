import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViraTopo — compre o topo",
  description: "O ranking competitivo para produtos digitais brasileiros.",
  keywords: ["ranking", "produtos digitais", "pix", "saas", "brasil"],
  openGraph: {
    title: "ViraTopo — compre o topo",
    description: "Seu produto sobe. Até alguém cobrir.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
