import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

function between(start, end) {
  const startIndex = schema.indexOf(start);
  const endIndex = schema.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing schema marker: ${start}`);
  assert.notEqual(endIndex, -1, `missing schema marker: ${end}`);
  return schema.slice(startIndex, endIndex);
}

function assertPrecedes(haystack, before, after, message) {
  const beforeIndex = haystack.indexOf(before);
  const afterIndex = haystack.indexOf(after);
  assert.notEqual(beforeIndex, -1, `missing schema marker: ${before}`);
  assert.notEqual(afterIndex, -1, `missing schema marker: ${after}`);
  assert.ok(beforeIndex < afterIndex, message ?? `${before} must precede ${after}`);
}

const normalizeProductUrl = between(
  "create or replace function public.normalize_product_url",
  "revoke all on function public.normalize_product_url",
);
const publicBids = between(
  "create table if not exists public.bids",
  "-- Upgrade the earlier bootstrap schema",
);
const rankingRpc = between(
  "create function public.get_public_ranking",
  "revoke all on function public.get_public_ranking",
);
const waitlistRpc = between(
  "create function public.register_waitlist_signup",
  "revoke all on function public.register_waitlist_signup",
);
const waitlistMigration = between(
  "-- Upgrade the first private waitlist revision",
  "create table if not exists private.product_events",
);
const prepareProductRow = between(
  "create or replace function private.prepare_product_row",
  "drop trigger if exists profiles_touch_updated_at",
);
const confirmBid = between(
  "create function private.confirm_bid",
  "drop function if exists private.record_product_event",
);

test("ciclos duram exatamente 24 horas e lances usam limites seguros", () => {
  assert.match(schema, /ends_at\s*=\s*starts_at\s*\+\s*interval '24 hours'/i);
  assert.match(schema, /ranking_cycles_no_overlap exclude using gist/i);
  assert.match(publicBids, /amount_cents between 100 and 999900/i);
  assert.match(publicBids, /amount_cents % 100 = 0/i);
  assert.match(publicBids, /payable_cents between 100 and amount_cents/i);
  assert.match(schema, /cycle_record\.status\s*<>\s*'open'/i);
  assert.match(schema, /confirmed_time\s*>=\s*cycle_record\.ends_at/i);
});

test("produto tem URL normalizada única e verificação controlada pelo servidor", () => {
  assert.match(schema, /normalized_url text generated always as/i);
  assert.match(schema, /products_normalized_url_format check \(\s*normalized_url is not null/i);
  assert.match(schema, /create unique index if not exists products_normalized_url_uidx\s+on public\.products \(normalized_url\)/i);
  assert.match(schema, /grant execute on function public\.normalize_product_url\(text\) to authenticated, service_role/i);
  assert.match(schema, /create or replace function private\.prepare_product_row\(\)[\s\S]*?security invoker/i);
  assert.match(schema, /new\.verification_status := old\.verification_status/i);
  assert.match(schema, /new\.verification_method := old\.verification_method/i);
  assert.match(schema, /new\.verified_at := old\.verified_at/i);
  assert.match(schema, /verified products require a verification method/i);
  assert.match(schema, /grant update \(name, url, category, description, logo_url\)\s+on public\.products to authenticated/i);
  assert.doesNotMatch(schema, /grant update \([^)]*verification_status[^)]*\)\s+on public\.products to authenticated/i);
});

test("referência do provedor e inscrições da lista não ficam na superfície pública", () => {
  assert.doesNotMatch(publicBids, /provider_reference/i);
  assert.match(schema, /create table if not exists private\.payment_attempts[\s\S]*?provider_reference text not null/i);
  assert.match(schema, /expected_amount_cents integer not null/i);
  assert.match(schema, /paid_amount_cents integer/i);
  assert.match(schema, /create table if not exists private\.waitlist_signups/i);
  assert.match(schema, /constraint waitlist_signups_email_key unique \(email\)/i);
  assert.match(waitlistRpc, /email text,\s*url text,\s*bid integer,\s*consent boolean,\s*fingerprint text/i);
  assert.match(waitlistRpc, /\$3 % 100 <> 0/i);
  assert.match(waitlistRpc, /on conflict on constraint waitlist_signups_email_key do nothing/i);
  assert.doesNotMatch(waitlistRpc, /status\s*=\s*'waiting'/i);
  assert.match(waitlistRpc, /current_attempts > 5[\s\S]*?return 'rate_limited'/i);
  assert.match(schema, /revoke all on function public\.register_waitlist_signup\(text, text, integer, boolean, text\)\s+from public, anon, authenticated/i);
  assert.match(schema, /grant execute on function public\.register_waitlist_signup\(text, text, integer, boolean, text\)\s+to service_role/i);
  assert.doesNotMatch(schema, /grant execute on function public\.join_waitlist/i);
});

test("somente a função privada do servidor confirma lances", () => {
  assert.match(schema, /create function private\.confirm_bid\([\s\S]*?set status = 'confirmed', confirmed_at = confirmed_time/i);
  assert.match(schema, /p_paid_amount_cents <> bid_record\.payable_cents/i);
  assert.match(schema, /revoke all on function private\.confirm_bid\(uuid, text, integer, text, timestamptz\)\s+from public, anon, authenticated/i);
  assert.match(schema, /grant execute on function private\.confirm_bid\(uuid, text, integer, text, timestamptz\)\s+to service_role/i);
  assert.doesNotMatch(schema, /grant (?:insert|update|all)[^;]*on public\.bids to authenticated/i);
});

test("aumento de lance cobra somente a diferença positiva e auditável", () => {
  assert.match(schema, /select coalesce\(max\(amount_cents\), 0\) into previous_amount_cents/i);
  assert.match(schema, /p_amount_cents <= previous_amount_cents/i);
  assert.match(schema, /amount_due_cents := p_amount_cents - previous_amount_cents/i);
  assert.match(schema, /insert into public\.bids \(product_id, cycle_id, amount_cents, payable_cents, status\)/i);
  assert.match(schema, /expected_amount_cents = excluded\.expected_amount_cents/i);
});

test("ranking público devolve uma linha por produto e desempata de forma determinística", () => {
  assert.match(rankingRpc, /select distinct on \(bids\.product_id\)/i);
  assert.match(rankingRpc, /order by bids\.product_id, bids\.amount_cents desc, bids\.confirmed_at asc, bids\.id asc/i);
  assert.match(rankingRpc, /row_number\(\) over/i);
  assert.match(rankingRpc, /order by\s+ranked_products\.amount_cents desc,\s+ranked_products\.confirmed_at asc,\s+ranked_products\.product_id asc/i);
  assert.match(rankingRpc, /products\.verification_status = 'verified'/i);
  assert.doesNotMatch(rankingRpc, /provider_reference/i);
});

test("métricas desconhecidas continuam NULL e eventos são deduplicados", () => {
  assert.match(rankingRpc, /metrics\.impressions,\s*metrics\.clicks/i);
  assert.doesNotMatch(rankingRpc, /coalesce\(metrics\.(?:impressions|clicks)/i);
  assert.match(schema, /create unique index if not exists product_events_dedupe_key_uidx/i);
  assert.match(schema, /on conflict \(dedupe_key\) do nothing/i);
  assert.match(schema, /primary key \(cycle_id, product_id\)/i);
});

test("RLS e índices cobrem tabelas privadas e chaves estrangeiras", () => {
  for (const table of [
    "public.profiles",
    "public.ranking_cycles",
    "public.products",
    "public.bids",
    "private.payment_attempts",
    "private.waitlist_signups",
    "private.waitlist_rate_limits",
    "private.product_events",
    "private.product_cycle_metrics",
  ]) {
    assert.match(schema, new RegExp(`alter table ${table.replace(".", "\\.")} force row level security`, "i"));
  }

  for (const index of [
    "products_owner_id_idx",
    "bids_product_id_idx",
    "bids_cycle_id_idx",
    "product_events_product_id_idx",
    "product_events_cycle_id_idx",
    "product_cycle_metrics_product_id_idx",
    "waitlist_rate_limits_window_idx",
  ]) {
    assert.match(schema, new RegExp(`create (?:unique )?index if not exists ${index}`, "i"));
  }
});

test("normalizacao reduz somente o host e preserva maiusculas do path publico", () => {
  assert.match(
    normalizeProductUrl,
    /regexp_replace\(btrim\(input_url\), '\^https\?:\/\/', '', 'i'\)/i,
  );
  assert.match(normalizeProductUrl, /split_part\([\s\S]*?'#', 1[\s\S]*?'\?', 1/i);
  assert.match(
    normalizeProductUrl,
    /regexp_replace\(split_part\(without_suffix, '\/', 1\), '\^www\\\.', '', 'i'\) as host/i,
  );
  assert.match(
    normalizeProductUrl,
    /substring\([\s\S]*?without_suffix[\s\S]*?char_length\(split_part\(without_suffix, '\/', 1\)\) \+ 1[\s\S]*?\) as path/i,
  );
  assert.match(
    normalizeProductUrl,
    /lower\(host\) \|\| regexp_replace\(path, '\/\+\$', ''\)/i,
  );
  assert.doesNotMatch(normalizeProductUrl, /lower\(regexp_replace\(btrim\(input_url\)/i);
  assert.match(
    schema,
    /update public\.products\s+set url = url\s+where normalized_url is distinct from public\.normalize_product_url\(url\)/i,
  );
});

test("qualquer campo publico moderado invalida a verificacao anterior", () => {
  assert.match(
    prepareProductRow,
    /row\(new\.name, new\.url, new\.category, new\.description, new\.logo_url\)\s+is distinct from\s+row\(old\.name, old\.url, old\.category, old\.description, old\.logo_url\)/i,
  );
  assert.match(
    prepareProductRow,
    /is distinct from[\s\S]*?new\.verification_status := 'pending'[\s\S]*?new\.verification_method := null[\s\S]*?new\.verification_note := null[\s\S]*?new\.verified_at := null/i,
  );
});

test("migracao da lista conserva apenas consentimento comprovado e deduplica antes da unicidade", () => {
  assert.doesNotMatch(waitlistMigration, /\bset\s+consent\s*=\s*true\b/i);
  assert.doesNotMatch(waitlistMigration, /consented_at\s*=\s*(?:coalesce\(|created_at|now\(|clock_timestamp\()/i);
  assert.match(
    waitlistMigration,
    /set consent_evidence = case\s+when consented_at is not null then 'legacy_timestamp'\s+else 'legacy_explicit_boolean'\s+end\s+where consent is true/i,
  );
  assert.match(
    waitlistMigration,
    /delete from private\.waitlist_signups\s+where consent is distinct from true\s+or consent_evidence is null/i,
  );
  assert.match(
    waitlistMigration,
    /partition by lower\(btrim\(email\)\)[\s\S]*?duplicate_position > 1/i,
  );
  assert.match(
    waitlistMigration,
    /consent is true\s+and \(\s*consented_at is not null\s+or consent_evidence = 'legacy_explicit_boolean'\s*\)/i,
  );
  assert.match(waitlistMigration, /alter column consent_evidence set not null/i);
  assert.match(
    waitlistRpc,
    /consent, consent_evidence, consented_at, source\s+\) values \(\s*normalized_email, btrim\(\$2\), \$3, true, 'site_checkbox_v1', clock_timestamp\(\), 'site'/i,
  );

  assertPrecedes(
    schema,
    "alter table private.waitlist_signups drop constraint if exists waitlist_signups_email_key",
    "partition by lower(btrim(email))",
    "the exact-case legacy key must be removed before deduplication",
  );
  assertPrecedes(
    schema,
    "partition by lower(btrim(email))",
    "set email = lower(btrim(email))",
    "case-insensitive duplicates must be removed before canonicalizing email",
  );
  assertPrecedes(
    schema,
    "set email = lower(btrim(email))",
    "add constraint waitlist_signups_email_key unique (email)",
    "the unique constraint must be added only after canonical deduplication",
  );
});

test("confirmacao trava e revalida a moderacao do produto antes de publicar o lance", () => {
  assert.match(
    confirmBid,
    /select products\.verification_status\s+into product_verification_status\s+from public\.products as products\s+where products\.id = bid_record\.product_id\s+for update/i,
  );
  assert.match(
    confirmBid,
    /if not found or product_verification_status <> 'verified' then\s+raise exception 'product must remain verified when payment is confirmed'/i,
  );
  assertPrecedes(
    confirmBid,
    "for update;\n  if not found or product_verification_status <> 'verified'",
    "set status = 'confirmed', confirmed_at = confirmed_time",
    "verification under row lock must happen before the bid becomes public",
  );
});
