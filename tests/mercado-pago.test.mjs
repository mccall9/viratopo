import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createMercadoPagoClient, formatPixAmount, verifyOrderSignature } from "../src/lib/mercado-pago.mjs";

const attemptId = "2cf170fe-e887-4811-bd40-59f874a923ef";
const orderId = "ORD01J49MMW3SSBK5PSV3DFR32959";
const payload = { attemptId, amountCents: 1900, payerEmail: "payer@example.test" };
const reply = () => Response.json({ id: orderId, status: "processing" });

test("PIX uses exact money strings and rejects invalid bid amounts", () => {
  assert.equal(formatPixAmount(100), "1.00");
  assert.equal(formatPixAmount(999900), "9999.00");
  for (const value of [0, -100, 150, NaN, Infinity, "100", 1000000]) {
    assert.throws(() => formatPixAmount(value), { code: "INVALID_AMOUNT" });
  }
});

test("repeated creation preserves the stored idempotency key and request", async () => {
  const calls = [];
  const client = createMercadoPagoClient({ accessToken: "private-token", fetchImpl: async (...args) => { calls.push(args); return reply(); } });
  await client.createPixOrder(payload);
  await client.createPixOrder(payload);
  assert.equal(calls[0][0], "https://api.mercadopago.com/v1/orders");
  assert.equal(calls[0][1].headers["X-Idempotency-Key"], attemptId);
  assert.equal(calls[0][1].body, calls[1][1].body);
  assert.equal(calls[0][1].redirect, "error");
  const body = JSON.parse(calls[0][1].body);
  assert.equal(body.external_reference, attemptId);
  assert.equal(body.total_amount, "19.00");
  assert.deepEqual(body.transactions.payments, [{ amount: "19.00", expiration_time: "PT30M", payment_method: { id: "pix", type: "bank_transfer" } }]);
});

test("invalid creation input and hostile order IDs never reach the network", async () => {
  let calls = 0;
  const client = createMercadoPagoClient({ accessToken: "private-token", fetchImpl: async () => { calls++; return reply(); } });
  await assert.rejects(client.createPixOrder({ ...payload, attemptId: "new-key" }), { code: "INVALID_ATTEMPT" });
  await assert.rejects(client.createPixOrder({ ...payload, payerEmail: "bad" }), { code: "INVALID_PAYER" });
  await assert.rejects(client.createPixOrder({ ...payload, amountCents: 150 }), { code: "INVALID_AMOUNT" });
  for (const id of ["../users", "https://evil.test", orderId + "?foo=bar"]) {
    await assert.rejects(client.getOrder(id), { code: "INVALID_ORDER_ID" });
  }
  assert.equal(calls, 0);
});

test("provider errors do not leak payloads or retry creation automatically", async () => {
  let calls = 0;
  const client = createMercadoPagoClient({ accessToken: "private-token", fetchImpl: async () => {
    calls++;
    return new Response("sensitive provider response", { status: 429, headers: { "retry-after": "120" } });
  } });
  await assert.rejects(client.createPixOrder(payload), { message: "PROVIDER_RATE_LIMITED", retryAfterSeconds: 120 });
  assert.equal(calls, 1);
  const timeoutClient = createMercadoPagoClient({ accessToken: "private-token", fetchImpl: async () => { throw new Error("secret"); } });
  await assert.rejects(timeoutClient.createPixOrder(payload), { message: "PROVIDER_UNREACHABLE" });
});

test("lookup rejects malformed, oversized and mismatched provider replies", async () => {
  for (const response of [Response.json(null), new Response("{"), new Response("x".repeat(1048577))]) {
    const client = createMercadoPagoClient({ accessToken: "private-token", fetchImpl: async () => response });
    await assert.rejects(client.getOrder(orderId), { code: "INVALID_PROVIDER_RESPONSE" });
  }
  const client = createMercadoPagoClient({ accessToken: "private-token", fetchImpl: async () => Response.json({ id: "ORD01J49MMW3SSBK5PSV3DFR32958" }) });
  await assert.rejects(client.getOrder(orderId), { code: "ORDER_ID_MISMATCH" });
});

test("webhook signature binds ID, request and time; rejects tampering and replay", () => {
  const secret = "test-only-webhook-secret";
  const now = 1788600000000;
  const requestId = "request-123";
  for (const ts of [String(now), String(now / 1000)]) {
    const digest = createHmac("sha256", secret).update(`id:${orderId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest("hex");
    const options = { secret, now, requestId, dataId: orderId, signature: `ts=${ts},v1=${digest}` };
    assert.equal(verifyOrderSignature(options), true);
    assert.equal(verifyOrderSignature({ ...options, dataId: orderId.toLowerCase() }), true);
    for (const patch of [{ secret: "wrong" }, { requestId: "tampered" }, { dataId: "ORD01J49MMW3SSBK5PSV3DFR32958" }, { now: now + 300001 }, { signature: options.signature + `,ts=${ts}` }, { signature: `ts=${ts},v1=broken` }]) {
      assert.equal(verifyOrderSignature({ ...options, ...patch }), false);
    }
  }
});
