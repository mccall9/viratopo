function asNonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNonNegativeInteger(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function asOptionalMetric(value) {
  return value === null || value === undefined ? null : asNonNegativeInteger(value);
}

export function parsePublicRanking(value) {
  if (!Array.isArray(value)) return null;

  const entries = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const position = asNonNegativeInteger(row.position);
    const amountCents = asNonNegativeInteger(row.amount_cents);
    const impressions = asOptionalMetric(row.impressions);
    const clicks = asOptionalMetric(row.clicks);
    const cycleId = asNonEmptyString(row.cycle_id);
    const productId = asNonEmptyString(row.product_id);
    const productName = asNonEmptyString(row.product_name);
    const productUrl = asNonEmptyString(row.product_url);
    const category = asNonEmptyString(row.category);
    const confirmedAt = asNonEmptyString(row.confirmed_at);

    if (
      position === null || position < 1 || amountCents === null || amountCents < 100 || amountCents > 999_900 ||
      !cycleId || !productId || !productName || !productUrl || !category || !confirmedAt ||
      (row.impressions !== null && row.impressions !== undefined && impressions === null) ||
      (row.clicks !== null && row.clicks !== undefined && clicks === null)
    ) return null;

    entries.push({
      position,
      cycleId,
      productId,
      productName,
      productUrl,
      category,
      description: typeof row.description === "string" ? row.description : "",
      logoUrl: typeof row.logo_url === "string" && row.logo_url.trim() ? row.logo_url.trim() : null,
      amountCents,
      confirmedAt,
      impressions,
      clicks,
    });
  }

  return entries.sort((a, b) => a.position - b.position);
}

export function publicProductHref(value) {
  try {
    const url = new URL(/^https?:\/\//iu.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}
