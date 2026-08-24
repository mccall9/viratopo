import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_IMAGE } from "@/lib/site-metadata";
import "@/styles/globals.css";
import "./viratopo.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ViraTopo — ranking transparente para produtos", template: "%s — ViraTopo" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["ranking de produtos", "produtos digitais", "PIX", "SaaS brasileiro", "lançamento"],
  authors: [{ name: "ViraTopo" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: "ViraTopo — ranking transparente para produtos",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "ViraTopo — ranking transparente para produtos",
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE.url],
  },
};

const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "pt-BR", description: "Ranking público de produtos ordenado por lances confirmados." };

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
