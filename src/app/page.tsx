import { HomeArena } from "@/components/home-arena";
import { getPublicRanking } from "@/lib/public-ranking";
import { createPageMetadata, SITE_DESCRIPTION } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Ranking público de produtos", description: SITE_DESCRIPTION, path: "/" });

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ranking = await getPublicRanking();
  return <HomeArena ranking={ranking} />;
}
