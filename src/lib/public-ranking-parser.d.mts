export type ParsedPublicRankingEntry = {
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

export function parsePublicRanking(value: unknown): ParsedPublicRankingEntry[] | null;
export function publicProductHref(value: string): string | null;
