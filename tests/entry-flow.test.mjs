import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProductUrl } from "../src/lib/entry-flow.mjs";

test("normaliza endereços de produto sem protocolo", () => {
  assert.equal(normalizeProductUrl("viratopo.com.br"), "https://viratopo.com.br/");
});

test("rejeita endereços e protocolos inválidos", () => {
  assert.equal(normalizeProductUrl("produto"), null);
  assert.equal(normalizeProductUrl("javascript:alert(1)"), null);
  assert.equal(normalizeProductUrl("https://usuario:senha@produto.com.br"), null);
});
