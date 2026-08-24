import type { Metadata } from "next";

export const SITE_NAME = "ViraTopo";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://viratopo.vercel.app").replace(/\/$/, "");
export const SITE_DESCRIPTION = "Conheça o ViraTopo, um MVP em pré-lançamento de ranking público para produtos brasileiros. O checkout PIX atual é demonstrativo e não realiza cobranças.";

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "ViraTopo — ranking público com critério transparente",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  index?: boolean;
};

export function createPageMetadata({ title, description, path, index = true }: PageMetadataOptions): Metadata {
  const socialTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index, follow: index },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: path,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}
