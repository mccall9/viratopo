import { createHmac } from "node:crypto";

export const WAITLIST_MAX_BODY_BYTES = 8_192;
export const WAITLIST_MIN_BID_CENTS = 100;
export const WAITLIST_MAX_BID_CENTS = 999_900;

const ALLOWED_FIELDS = new Set(["email", "productUrl", "bidCents", "consent", "website"]);

export class WaitlistBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the waitlist limit.");
    this.name = "WaitlistBodyTooLargeError";
  }
}

export function isJsonContentType(value) {
  if (typeof value !== "string") return false;
  return value.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

export function contentLengthExceedsLimit(value, limit = WAITLIST_MAX_BODY_BYTES) {
  if (typeof value !== "string" || value.trim() === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed > limit;
}

export async function readBodyWithLimit(body, limit = WAITLIST_MAX_BODY_BYTES) {
  if (!body) return "";

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limit) {
        await reader.cancel();
        throw new WaitlistBodyTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

export function normalizeWaitlistEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null;
}

export function normalizeWaitlistProductUrl(value) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (candidate.length < 4 || candidate.length > 2_048) return null;

  try {
    const url = new URL(/^https?:\/\//iu.test(candidate) ? candidate : `https://${candidate}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password || !url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function validateWaitlistPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: { body: "invalid_object" } };
  }

  if (typeof input.website === "string" && input.website.trim() !== "") {
    return { ok: true, honeypot: true };
  }

  const errors = {};
  const unexpectedFields = Object.keys(input).filter((field) => !ALLOWED_FIELDS.has(field));
  if (unexpectedFields.length > 0) errors.body = "unexpected_fields";

  if (input.website !== undefined && typeof input.website !== "string") {
    errors.website = "invalid_type";
  }

  const email = normalizeWaitlistEmail(input.email);
  if (!email) errors.email = "invalid_email";

  const productUrl = normalizeWaitlistProductUrl(input.productUrl);
  if (!productUrl) errors.productUrl = "invalid_url";

  if (
    !Number.isSafeInteger(input.bidCents) ||
    input.bidCents < WAITLIST_MIN_BID_CENTS ||
    input.bidCents > WAITLIST_MAX_BID_CENTS ||
    input.bidCents % 100 !== 0
  ) {
    errors.bidCents = "out_of_range";
  }

  if (input.consent !== true) errors.consent = "required";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    honeypot: false,
    value: { email, productUrl, bidCents: input.bidCents, consent: true },
  };
}

export function getWaitlistConfig(env) {
  const serviceRoleKey = env?.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const rawUrl = env?.SUPABASE_URL?.trim();
  const legalControllerName = env?.LEGAL_CONTROLLER_NAME?.trim();
  const legalContactEmail = normalizeWaitlistEmail(env?.LEGAL_CONTACT_EMAIL);
  const rateLimitSecret = env?.WAITLIST_RATE_LIMIT_SECRET?.trim();
  if (
    !serviceRoleKey ||
    !rawUrl ||
    !legalControllerName ||
    legalControllerName.length > 200 ||
    !legalContactEmail ||
    !rateLimitSecret ||
    rateLimitSecret.length < 32
  ) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") return null;
    return {
      supabaseUrl: url.toString().replace(/\/$/, ""),
      serviceRoleKey,
      legalControllerName,
      legalContactEmail,
      rateLimitSecret,
    };
  } catch {
    return null;
  }
}

export function getWaitlistRequestAddress(headers) {
  for (const name of ["x-vercel-forwarded-for", "x-forwarded-for"]) {
    const value = headers.get(name)?.split(",", 1)[0]?.trim();
    if (value && value.length <= 128) return value;
  }
  return "address-unavailable";
}

export function createWaitlistFingerprint(address, secret) {
  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function upsertWaitlistSignup({ signup, fingerprint, config, fetchImpl }) {
  const endpoint = `${config.supabaseUrl}/rest/v1/rpc/register_waitlist_signup`;

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: signup.email,
        url: signup.productUrl,
        bid: signup.bidCents,
        consent: signup.consent,
        fingerprint,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return { ok: false, rateLimited: false, upstreamStatus: response.status };
    const result = await response.json().catch(() => null);
    if (result === "rate_limited") return { ok: false, rateLimited: true, upstreamStatus: response.status };
    return { ok: result === "accepted", rateLimited: false, upstreamStatus: response.status };
  } catch {
    return { ok: false, rateLimited: false, upstreamStatus: null };
  }
}

function jsonResponse(status, payload, extraHeaders = {}) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store", ...extraHeaders },
  });
}

function errorResponse(status, code, message, fields, extraHeaders) {
  return jsonResponse(
    status,
    { ok: false, error: { code, message, ...(fields ? { fields } : {}) } },
    extraHeaders,
  );
}

const acceptedResponse = () => jsonResponse(200, { ok: true, data: { status: "accepted" } });

export function createWaitlistHandler({ env, fetchImpl }) {
  return async function POST(request) {
    if (!isJsonContentType(request.headers.get("content-type"))) {
      return errorResponse(415, "UNSUPPORTED_MEDIA_TYPE", "Envie o corpo como application/json.");
    }

    if (contentLengthExceedsLimit(request.headers.get("content-length"))) {
      return errorResponse(413, "PAYLOAD_TOO_LARGE", "O corpo da requisição excede o limite permitido.");
    }

    let rawBody;
    try {
      rawBody = await readBodyWithLimit(request.body);
    } catch (error) {
      if (error instanceof WaitlistBodyTooLargeError) {
        return errorResponse(413, "PAYLOAD_TOO_LARGE", "O corpo da requisição excede o limite permitido.");
      }
      return errorResponse(400, "INVALID_BODY", "Não foi possível ler o corpo da requisição.");
    }

    let input;
    try {
      input = JSON.parse(rawBody);
    } catch {
      return errorResponse(400, "INVALID_JSON", "Envie um objeto JSON válido.");
    }

    const validation = validateWaitlistPayload(input);
    if (!validation.ok) {
      return errorResponse(422, "VALIDATION_ERROR", "Revise os campos enviados.", validation.errors);
    }

    // Return the same response as a legitimate request so the honeypot reveals nothing.
    if (validation.honeypot) return acceptedResponse();

    const config = getWaitlistConfig(env);
    if (!config) {
      return errorResponse(
        503,
        "SERVICE_UNAVAILABLE",
        "A lista de espera está temporariamente indisponível.",
        undefined,
        { "retry-after": "60" },
      );
    }

    const fingerprint = createWaitlistFingerprint(getWaitlistRequestAddress(request.headers), config.rateLimitSecret);
    const result = await upsertWaitlistSignup({ signup: validation.value, fingerprint, config, fetchImpl });
    if (result.rateLimited) {
      return errorResponse(
        429,
        "RATE_LIMITED",
        "Muitas tentativas. Aguarde antes de tentar novamente.",
        undefined,
        { "retry-after": "3600" },
      );
    }
    if (!result.ok) {
      return errorResponse(502, "UPSTREAM_ERROR", "Não foi possível registrar a solicitação agora.");
    }

    return acceptedResponse();
  };
}
