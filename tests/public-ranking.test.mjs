import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parsePublicRanking, publicProductHref } from "../src/lib/public-ranking-parser.mjs";

const validRow = {
  position: 1,
  cycle_id: "1fe44fe1-b6c8-4e3a-8cd9-78e9aeb7a215",
  product_id: "ee26f96f-400d-4fc2-835c-15cf811077e0",
  product_name: "Produto real",
  product_url: "produto.com.br",
  category: "SaaS",
  description: "Descrição",
  logo_url: null,
  amount_cents: 100,
  confirmed_at: "2026-08-24T12:00:00Z",
  impressions: null,
  clicks: null,
};

test("normaliza a resposta pública sem transformar métrica ausente em zero", () => {
  assert.deepEqual(parsePublicRanking([validRow]), [{
    position: 1,
    cycleId: validRow.cycle_id,
    productId: validRow.product_id,
    productName: "Produto real",
    productUrl: "produto.com.br",
    category: "SaaS",
    description: "Descrição",
    logoUrl: null,
    amountCents: 100,
    confirmedAt: "2026-08-24T12:00:00Z",
    impressions: null,
    clicks: null,
  }]);
  assert.equal(publicProductHref("produto.com.br"), "https://produto.com.br/");
});

test("rejeita payload parcial, lance fora do contrato e URL com credenciais", () => {
  assert.equal(parsePublicRanking({}), null);
  assert.equal(parsePublicRanking([{ ...validRow, amount_cents: 1_000_000 }]), null);
  assert.equal(parsePublicRanking([{ ...validRow, product_name: "" }]), null);
  assert.equal(publicProductHref("https://user:pass@produto.com.br"), null);
});

test("o leitor público usa somente a RPC sanitizada e falha fechado", async () => {
  const source = await readFile("src/lib/public-ranking.ts", "utf8");
  assert.match(source, /rpc\/get_public_ranking/);
  assert.match(source, /cache: "no-store"/);
  assert.match(source, /state: "unavailable", entries: \[\]/);
  assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test("o front não consulta diretamente tabelas privadas ou referências de pagamento", async () => {
  const files = [
    "src/lib/public-ranking.ts",
    "src/app/ranking/page.tsx",
    "src/components/home-arena.tsx",
  ];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(source, /payment_attempts|provider_reference|private\./);
});
