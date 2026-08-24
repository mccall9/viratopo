export function normalizeProductUrl(value) {
  const candidate = value.trim();
  if (!candidate) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

// Repeating the same confirmation signal cannot advance the workflow twice.
export function requestPaymentConfirmation(current) {
  return current === "idle" ? "confirmation-pending" : current;
}
