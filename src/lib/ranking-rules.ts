export const RANKING_RULES = {
  cycleHours: 24,
  minimumBidCents: 100,
  maximumBidCents: 999_900,
  currency: "BRL",
  locale: "pt-BR",
  timeZone: "America/Fortaleza",
} as const;

export function formatBid(cents: number) {
  return new Intl.NumberFormat(RANKING_RULES.locale, {
    style: "currency",
    currency: RANKING_RULES.currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
