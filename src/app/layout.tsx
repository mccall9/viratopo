import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "@/styles/globals.css";
import "./viratopo.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument", display: "swap" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://viratopo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ViraTopo — ranking transparente para produtos", template: "%s — ViraTopo" },
  description: "Coloque seu produto em um ranking público ordenado por lances confirmados. Sem votos, algoritmo oculto ou números inventados.",
  keywords: ["ranking de produtos", "produtos digitais", "PIX", "SaaS brasileiro", "lançamento"],
  authors: [{ name: "ViraTopo" }],
  alternates: { canonical: "/" },
  openGraph: { title: "ViraTopo — ranking transparente para produtos", description: "Uma disputa pública ordenada por lances confirmados. Sem números inventados.", type: "website", locale: "pt_BR", url: "/", siteName: "ViraTopo" },
  twitter: { card: "summary_large_image", title: "ViraTopo", description: "Ranking transparente para produtos independentes." },
};

const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "ViraTopo", url: siteUrl, inLanguage: "pt-BR", description: "Ranking público de produtos ordenado por lances confirmados." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {children}
      </body>
    </html>
  );
}
