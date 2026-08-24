import assert from "node:assert/strict";
import test from "node:test";
import {
  WAITLIST_MAX_BODY_BYTES,
  createWaitlistFingerprint,
  createWaitlistHandler,
  getWaitlistConfig,
  normalizeWaitlistEmail,
  normalizeWaitlistProductUrl,
  validateWaitlistPayload,
} from "../src/lib/waitlist.mjs";

const validPayload = {
  email: "Maker@Example.com ",
  productUrl: "produto.com.br#planos",
  bidCents: 100,
  consent: true,
  website: "",
};

const configuredEnv = {
  SUPABASE_URL: "https://project.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: "server-secret",
  LEGAL_CONTROLLER_NAME: "ViraTopo Tecnologia Ltda.",
  LEGAL_CONTACT_EMAIL: "privacidade@viratopo.test",
  WAITLIST_RATE_LIMIT_SECRET: "test-rate-limit-secret-with-32-characters",
};

const acceptedUpstream = () => new Response(JSON.stringify("accepted"), {
  status: 200,
  headers: { "content-type": "application/json" },
});

function request(payload, options = {}) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return new Request("https://viratopo.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", ...options.headers },
    body,
  });
}

test("normaliza e valida os campos aceitos", () => {
  assert.equal(normalizeWaitlistEmail(" Maker@Example.com "), "maker@example.com");
  assert.equal(normalizeWaitlistProductUrl("produto.com.br#planos"), "https://produto.com.br/");

  const result = validateWaitlistPayload(validPayload);
  assert.equal(result.ok, true);
  assert.equal(result.honeypot, false);
  assert.deepEqual(result.value, {
    email: "maker@example.com",
    productUrl: "https://produto.com.br/",
    bidCents: 100,
    consent: true,
  });
});

test("rejeita campos inválidos sem devolver os valores recebidos", () => {
  const result = validateWaitlistPayload({
    email: "segredo-invalido",
    productUrl: "javascript:alert(1)",
    bidCents: 99,
    consent: false,
    unexpected: "valor privado",
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, {
    body: "unexpected_fields",
    email: "invalid_email",
    productUrl: "invalid_url",
    bidCents: "out_of_range",
    consent: "required",
  });
  assert.equal(JSON.stringify(result).includes("segredo-invalido"), false);
});

test("aceita somente passos inteiros de R$ 1", () => {
  const result = validateWaitlistPayload({ ...validPayload, bidCents: 150 });
  assert.equal(result.ok, false);
  assert.equal(result.errors.bidCents, "out_of_range");
});

test("honeypot responde como sucesso e não acessa o Supabase", async () => {
  let calls = 0;
  const handler = createWaitlistHandler({
    env: {},
    fetchImpl: async () => {
      calls += 1;
      return acceptedUpstream();
    },
  });

  const response = await handler(request({ ...validPayload, website: "https://spam.test" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, data: { status: "accepted" } });
  assert.equal(calls, 0);
});

test("aplica content-type, JSON, tamanho e validação com status HTTP estáveis", async () => {
  const handler = createWaitlistHandler({ env: configuredEnv, fetchImpl: async () => acceptedUpstream() });

  const wrongType = await handler(request(validPayload, { headers: { "content-type": "text/plain" } }));
  assert.equal(wrongType.status, 415);
  assert.equal((await wrongType.json()).error.code, "UNSUPPORTED_MEDIA_TYPE");

  const invalidJson = await handler(request("{"));
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).error.code, "INVALID_JSON");

  const tooLarge = await handler(request("x", { headers: { "content-length": String(WAITLIST_MAX_BODY_BYTES + 1) } }));
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json()).error.code, "PAYLOAD_TOO_LARGE");

  const streamedTooLarge = await handler(request("x".repeat(WAITLIST_MAX_BODY_BYTES + 1)));
  assert.equal(streamedTooLarge.status, 413);
  assert.equal((await streamedTooLarge.json()).error.code, "PAYLOAD_TOO_LARGE");

  const invalidFields = await handler(request({ ...validPayload, consent: false }));
  assert.equal(invalidFields.status, 422);
  assert.equal((await invalidFields.json()).error.fields.consent, "required");
});

test("retorna 503 honesto quando a configuração server-only está ausente", async () => {
  assert.equal(getWaitlistConfig({ SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" }), null);
  assert.equal(getWaitlistConfig({ ...configuredEnv, LEGAL_CONTROLLER_NAME: "" }), null);
  assert.equal(getWaitlistConfig({ ...configuredEnv, LEGAL_CONTACT_EMAIL: "" }), null);
  assert.equal(getWaitlistConfig({ ...configuredEnv, WAITLIST_RATE_LIMIT_SECRET: "short" }), null);
  assert.equal(getWaitlistConfig({ ...configuredEnv, SUPABASE_URL: "http://project.supabase.co" }), null);
  const handler = createWaitlistHandler({ env: {}, fetchImpl: async () => acceptedUpstream() });
  const response = await handler(request(validPayload));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
});

test("chama somente a RPC privada de pré-cadastro com credenciais do servidor", async () => {
  let captured;
  const handler = createWaitlistHandler({
    env: configuredEnv,
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return acceptedUpstream();
    },
  });

  const response = await handler(request(validPayload));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(captured.url, "https://project.supabase.co/rest/v1/rpc/register_waitlist_signup");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers.apikey, "server-secret");
  assert.equal(captured.init.headers.authorization, "Bearer server-secret");
  assert.equal(captured.init.headers.prefer, undefined);
  assert.deepEqual(JSON.parse(captured.init.body), {
    email: "maker@example.com",
    url: "https://produto.com.br/",
    bid: 100,
    consent: true,
    fingerprint: createWaitlistFingerprint("address-unavailable", configuredEnv.WAITLIST_RATE_LIMIT_SECRET),
  });

  const publicResponse = JSON.stringify(await response.json());
  assert.equal(publicResponse.includes("server-secret"), false);
  assert.equal(publicResponse.includes("maker@example.com"), false);
});

test("transforma o limite durável da RPC em 429 sem fingir cadastro", async () => {
  const handler = createWaitlistHandler({
    env: configuredEnv,
    fetchImpl: async () => new Response(JSON.stringify("rate_limited"), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  });
  const response = await handler(request(validPayload));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "3600");
  assert.equal((await response.json()).error.code, "RATE_LIMITED");
});

test("traduz falhas do Supabase sem vazar detalhes do provedor", async () => {
  const handler = createWaitlistHandler({
    env: configuredEnv,
    fetchImpl: async () => new Response('{"message":"internal details"}', { status: 500 }),
  });
  const response = await handler(request(validPayload));
  assert.equal(response.status, 502);
  const payload = await response.json();
  assert.equal(payload.error.code, "UPSTREAM_ERROR");
  assert.equal(JSON.stringify(payload).includes("internal details"), false);
});
