import Link from "next/link";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ShareRanking } from "@/components/share-ranking";
import { ViraIcon } from "@/components/vira-icon";
import { getPublicRanking, publicProductHref } from "@/lib/public-ranking";
import { formatBid } from "@/lib/ranking-rules";
import { createPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Ranking de produtos",
  description: "Acompanhe a classificação pública do ViraTopo. Posições só aparecem após confirmação e métricas só aparecem quando existem.",
  path: "/ranking",
});

const number = new Intl.NumberFormat("pt-BR");

export default async function RankingPage() {
  const ranking = await getPublicRanking();
  const hasEntries = ranking.entries.length > 0;
  const isReadyEmpty = ranking.state === "ready" && !hasEntries;

  const status = hasEntries
    ? { label: "EM DISPUTA", value: `${ranking.entries.length} ${ranking.entries.length === 1 ? "produto" : "produtos"}`, note: "somente confirmações válidas" }
    : ranking.state === "unavailable"
      ? { label: "DADOS", value: "Indisponíveis", note: "tente novamente mais tarde" }
      : ranking.state === "unconfigured"
        ? { label: "ESTADO ATUAL", value: "Pré-lançamento", note: "fonte ainda não conectada" }
        : { label: "FONTE PÚBLICA", value: "Sem entradas", note: "temporada não presumida" };

  return (
    <div className="arena-app">
      <a className="skip" href="#ranking">Pular para o ranking</a>
      <ArenaNav active="ranking" />
      <main>
        <section className="page-head" id="ranking">
          <div>
            <span className="eyebrow">RANKING PÚBLICO</span>
            <h1>{hasEntries ? "A disputa, sem voto escondido." : isReadyEmpty ? "Nenhuma entrada confirmada foi retornada." : ranking.state === "unconfigured" ? "O placar será conectado antes do lançamento." : "O placar não pôde ser consultado."}</h1>
            <p>{hasEntries ? "Um produto por posição, ordenado pelo maior lance confirmado." : isReadyEmpty ? "A fonte pública respondeu sem entradas. Isso não presume que uma temporada esteja aberta." : ranking.state === "unconfigured" ? "A fonte pública ainda não está configurada. Não mostramos posições de demonstração." : "A fonte pública está temporariamente indisponível. Nenhuma posição foi presumida."}</p>
          </div>
          <div className="page-status"><span>{status.label}</span><strong>{status.value}</strong><small>{status.note}</small></div>
        </section>

        <section className="ranking-layout" aria-labelledby="ranking-title" data-state={hasEntries ? "populated" : "empty"}>
          <h2 className="sr-only" id="ranking-title">Classificação atual</h2>
          <header className="ranking-header" aria-hidden="true"><span>POSIÇÃO</span><span>PRODUTO</span><span>VISIBILIDADE</span><span>LANCE</span></header>
          {hasEntries ? (
            <ol className="rank-list">
              {ranking.entries.map((entry) => {
                const href = publicProductHref(entry.productUrl);
                return (
                  <li className="rank-row" key={entry.productId}>
                    <strong className="rank-position tabular">#{entry.position}</strong>
                    <div className="rank-product">
                      <span className="rank-monogram" aria-hidden="true">{entry.productName.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong>{entry.productName}</strong>
                        <span>{entry.category}</span>
                        {entry.description && <p>{entry.description}</p>}
                      </div>
                    </div>
                    <dl className="rank-metrics">
                      <div><dt>Exibições</dt><dd className="tabular">{entry.impressions === null ? "—" : number.format(entry.impressions)}</dd></div>
                      <div><dt>Cliques</dt><dd className="tabular">{entry.clicks === null ? "—" : number.format(entry.clicks)}</dd></div>
                    </dl>
                    <div className="rank-bid">
                      <strong className="tabular">{formatBid(entry.amountCents)}</strong>
                      {href && <a href={href} target="_blank" rel="noopener noreferrer">Visitar produto <ViraIcon name="arrow-right" size={15} /></a>}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rank-empty">
              <span className="empty-position tabular">—</span>
              <div>
                <h2>{isReadyEmpty ? "Nenhuma entrada confirmada retornada." : ranking.state === "unconfigured" ? "Ranking ainda não conectado." : "Consulta temporariamente indisponível."}</h2>
                <p>{isReadyEmpty ? "A resposta não informa se há uma temporada aberta. Você pode simular o fluxo sem reservar uma posição." : ranking.state === "unconfigured" ? "A fonte pública será conectada antes da abertura; nenhuma vaga ou posição está sendo anunciada agora." : "Não conseguimos consultar a fonte pública agora. Nenhuma posição foi presumida."}</p>
              </div>
              <Link className="button button-primary" href="/">Simular entrada <ViraIcon name="arrow-right" /></Link>
            </div>
          )}
        </section>

        <section className="ranking-callout">
          <span className="eyebrow">CRITÉRIO DE ORDENAÇÃO</span>
          <p>Maior lance confirmado ocupa a melhor posição. Em caso de empate, vale a confirmação mais antiga.</p>
          <div className="ranking-callout-actions"><Link href="/termos">Ver regras completas <ViraIcon name="arrow-right" size={16} /></Link><ShareRanking entriesCount={ranking.entries.length} state={ranking.state} /></div>
        </section>
      </main>
      <ArenaFooter />
    </div>
  );
}
