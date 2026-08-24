import { HomeArena } from "@/components/home-arena";
import { createPageMetadata, SITE_DESCRIPTION } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Ranking público de produtos", description: SITE_DESCRIPTION, path: "/" });

export default function HomePage() {
  return <HomeArena />;
}
