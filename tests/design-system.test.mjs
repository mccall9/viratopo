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

test("o hero começa sem faixa redundante e declara o estado do simulador", async () => {
  const home = await readFile("src/components/home-arena.tsx", "utf8");
  assert.doesNotMatch(home, /className="season-rail"|Temporada sem entradas/);
  assert.match(home, /A simulação não cobra, publica ou reserva uma posição/);
  assert.match(home, /Nenhuma cobrança ou posição foi criada/);
  assert.match(home, /Recebemos sua solicitação; se elegível/);
  assert.doesNotMatch(home, /Você entrou na lista/);
});

test("a hero usa regras reais e termina em pré-cadastro verificável", async () => {
  const home = await readFile("src/components/home-arena.tsx", "utf8");
  assert.match(home, /className="hero-radar"/);
  assert.match(home, /className="hero-console"/);
  assert.match(home, /Simular meu lance/);
  assert.match(home, /fetch\("\/api\/waitlist"/);
  assert.match(home, /Lista temporariamente indisponível/);
  assert.doesNotMatch(home, /DEMONSTRACAO|000201010212|Confirmar pagamento/);
});

test("os estados preenchidos usam a fonte pública sem produtos fictícios", async () => {
  const page = await readFile("src/app/page.tsx", "utf8");
  const ranking = await readFile("src/app/ranking/page.tsx", "utf8");
  assert.match(page, /getPublicRanking/);
  assert.match(ranking, /getPublicRanking/);
  assert.doesNotMatch(`${page}\n${ranking}`, /Runnext|Pedropaula|Rankinho|Talkbud/);
});

test("estados sem fonte pronta não anunciam o primeiro lugar como vazio ou livre", async () => {
  const home = await readFile("src/components/home-arena.tsx", "utf8");
  const ranking = await readFile("src/app/ranking/page.tsx", "utf8");
  const share = await readFile("src/components/share-ranking.tsx", "utf8");
  assert.match(home, /isReadyEmpty = ranking\.state === "ready"/);
  assert.match(ranking, /isReadyEmpty = ranking\.state === "ready"/);
  assert.match(share, /state === "ready"/);
  assert.doesNotMatch(`${home}\n${ranking}`, /isReadyEmpty \? "#1"/);
  assert.doesNotMatch(share, /#1 do ViraTopo ainda está vazio/);
});
