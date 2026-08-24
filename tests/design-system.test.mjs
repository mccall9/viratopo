import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a fundação visual não reintroduz camadas antigas", async () => {
  const files = ["src/app/viratopo.css", "src/components/home-arena.tsx", "src/components/arena-nav.tsx", "src/app/layout.tsx"];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  for (const forbidden of ["linear-gradient", "radial-gradient", "lucide-react", "@mantine/core", "will-change"]) {
    assert.equal(source.includes(forbidden), false, `${forbidden} não deve voltar ao front`);
  }
});

test("o fundo mantém o grid de quadrados espaçados e visível", async () => {
  const globals = await readFile("src/styles/globals.css", "utf8");
  assert.match(globals, /width='36' height='36'/);
  assert.match(globals, /width='30' height='30'/);
  assert.match(globals, /stroke-opacity='\.065'/);
});

test("o hero começa sem faixa redundante e mantém o aviso causal", async () => {
  const home = await readFile("src/components/home-arena.tsx", "utf8");
  assert.doesNotMatch(home, /className="season-rail"|Temporada sem entradas/);
  assert.match(home, /className="inline-notice"/);
  assert.match(home, /Nenhuma cobrança ou entrada real foi criada/);
});

test("a hero usa regras reais e uma demonstração inequivocamente inválida", async () => {
  const home = await readFile("src/components/home-arena.tsx", "utf8");
  assert.match(home, /className="hero-radar"/);
  assert.match(home, /className="hero-console"/);
  assert.match(home, /DEMONSTRACAO-VIRATOPO-SEM-COBRANCA/);
  assert.match(home, /Preparar entrada/);
  assert.doesNotMatch(home, /000201010212/);
  assert.doesNotMatch(home, /Entrar no ranking/);
});
