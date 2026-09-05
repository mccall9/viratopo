// Node-only transport. Call only after authorizing the owner and persisting
// an immutable bid/payment attempt; never pass a browser-supplied amount here.
import { createHmac, timingSafeEqual } from "node:crypto";
import { readBodyWithLimit } from "./waitlist.mjs";

const ORIGIN = "https://api.mercadopago.com";
const ORDER_ID = /^ORD[A-Z0-9]{26}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MercadoPagoError extends Error {
  constructor(code, retryAfterSeconds = null) {
    super(code);
    this.name = "MercadoPagoError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function formatPixAmount(cents) {
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 999900 || cents % 100 !== 0) {
    throw new MercadoPagoError("INVALID_AMOUNT");
  }
  return `${Math.floor(cents / 100)}.00`;
}

// The signature authenticates the resource ID, not the JSON body or its status.
// Consumers MUST fetch the order and compare it with the persisted attempt.
export function verifyOrderSignature({ signature, requestId, dataId, secret, now = Date.now() }) {
  if (typeof secret !== "string" || !secret || typeof signature !== "string" || signature.length > 512 ||
      typeof requestId !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(requestId) ||
      typeof dataId !== "string" || !ORDER_ID.test(dataId.toUpperCase())) return false;
  const parts = signature.split(",").map((part) => part.trim());
  const timestamps = parts.filter((part) => part.startsWith("ts="));
  const hashes = parts.filter((part) => part.startsWith("v1="));
  if (timestamps.length !== 1 || hashes.length !== 1) return false;
  const ts = timestamps[0].slice(3);
  const hash = hashes[0].slice(3);
  if (!/^\d{10}(?:\d{3})?$/.test(ts) || !/^[a-f0-9]{64}$/i.test(hash)) return false;
  const milliseconds = Number(ts) * (ts.length === 10 ? 1000 : 1);
  if (!Number.isFinite(now) || Math.abs(now - milliseconds) > 300000) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  return timingSafeEqual(expected, Buffer.from(hash, "hex"));
}

export function createMercadoPagoClient({ accessToken, fetchImpl = fetch }) {
  if (typeof accessToken !== "string" || !accessToken.trim() || /\s/.test(accessToken)) {
    throw new MercadoPagoError("MISSING_CREDENTIALS");
  }

  async function request(path, { body, idempotencyKey } = {}) {
    let response;
    try {
      response = await fetchImpl(`${ORIGIN}${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: "application/json",
          ...(body ? { "content-type": "application/json", "X-Idempotency-Key": idempotencyKey } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // A timeout may have created an order. Retry only with the SAME stored key.
      throw new MercadoPagoError("PROVIDER_UNREACHABLE");
    }
    if (!response.ok) {
      const retry = Number(response.headers.get("retry-after"));
      await response.body?.cancel();
      throw new MercadoPagoError(response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_REJECTED",
        response.status === 429 ? (Number.isSafeInteger(retry) && retry > 0 ? retry : 60) : null);
    }
    try {
      const result = JSON.parse(await readBodyWithLimit(response.body, 1048576));
      if (!result || typeof result !== "object" || !ORDER_ID.test(result.id)) throw new Error();
      return result;
    } catch {
      throw new MercadoPagoError("INVALID_PROVIDER_RESPONSE");
    }
  }

  return {
    async createPixOrder({ attemptId, amountCents, payerEmail }) {
      if (typeof attemptId !== "string" || !UUID.test(attemptId)) throw new MercadoPagoError("INVALID_ATTEMPT");
      if (typeof payerEmail !== "string" || payerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
        throw new MercadoPagoError("INVALID_PAYER");
      }
      const amount = formatPixAmount(amountCents);
      return request("/v1/orders", {
        idempotencyKey: attemptId,
        body: {
          type: "online", processing_mode: "automatic", external_reference: attemptId,
          total_amount: amount, payer: { email: payerEmail },
          transactions: { payments: [{ amount, expiration_time: "PT30M", payment_method: { id: "pix", type: "bank_transfer" } }] },
        },
      });
    },
    async getOrder(orderId) {
      if (typeof orderId !== "string" || !ORDER_ID.test(orderId)) throw new MercadoPagoError("INVALID_ORDER_ID");
      const result = await request(`/v1/orders/${orderId}`);
      if (result.id !== orderId) throw new MercadoPagoError("ORDER_ID_MISMATCH");
      return result;
    },
  };
}
