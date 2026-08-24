import { parsePublicRanking, publicProductHref } from "@/lib/public-ranking-parser.mjs";

export type PublicRankingEntry = {
  position: number;
  cycleId: string;
  productId: string;
  productName: string;
  productUrl: string;
  category: string;
  description: string;
  logoUrl: string | null;
  amountCents: number;
  confirmedAt: string;
  impressions: number | null;
  clicks: number | null;
};

export type PublicRankingResult = {
  state: "ready" | "unconfigured" | "unavailable";
  entries: PublicRankingEntry[];
};

function getPublicSupabaseConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !anonKey) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") return null;
    return { url: url.toString().replace(/\/$/, ""), anonKey };
  } catch {
    return null;
  }
}

export async function getPublicRanking(): Promise<PublicRankingResult> {
  const config = getPublicSupabaseConfig();
  if (!config) return { state: "unconfigured", entries: [] };

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/get_public_ranking`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        authorization: `Bearer ${config.anonKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_cycle_id: null }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return { state: "unavailable", entries: [] };
    const entries = parsePublicRanking(await response.json());
    return entries ? { state: "ready", entries } : { state: "unavailable", entries: [] };
  } catch {
    return { state: "unavailable", entries: [] };
  }
}

export { publicProductHref };
