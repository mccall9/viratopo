import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProductUrl, requestPaymentConfirmation } from "../src/lib/entry-flow.mjs";

test("normaliza endereços de produto sem protocolo", () => {
  assert.equal(normalizeProductUrl("viratopo.com.br"), "https://viratopo.com.br/");
});

test("rejeita endereços e protocolos inválidos", () => {
  assert.equal(normalizeProductUrl("produto"), null);
  assert.equal(normalizeProductUrl("javascript:alert(1)"), null);
});

test("sinal de confirmação é idempotente", () => {
  assert.equal(requestPaymentConfirmation("idle"), "confirmation-pending");
  assert.equal(requestPaymentConfirmation("confirmation-pending"), "confirmation-pending");
});
