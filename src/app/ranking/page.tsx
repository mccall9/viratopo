import Link from "next/link";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon } from "@/components/vira-icon";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Ranking de produtos", description: "Acompanhe a classificação pública do ViraTopo. Posições só aparecem após confirmação e métricas só aparecem quando existem.", path: "/ranking" });

export default function RankingPage() {
  return (
    <div className="arena-app">
      <a className="skip" href="#ranking">Pular para o ranking</a>
      <ArenaNav active="ranking" />
      <main>
        <section className="page-head" id="ranking">
          <div><span className="eyebrow">RANKING PÚBLICO</span><h1>O placar começa com dados reais.</h1><p>A primeira entrada confirmada inaugura a classificação. Não mostramos posições de demonstração.</p></div>
          <div className="page-status"><span>ESTADO ATUAL</span><strong>Pré-lançamento</strong><small>sem entradas confirmadas</small></div>
        </section>
        <section className="ranking-layout" aria-labelledby="ranking-title">
          <header className="ranking-header"><span>POSIÇÃO</span><span>PRODUTO</span><span>VISIBILIDADE</span><span>LANCE</span></header>
          <div className="rank-empty"><span className="empty-position tabular">#1</span><div><h2 id="ranking-title">A próxima posição é a primeira.</h2><p>Cadastre seu produto e teste o fluxo. A publicação real dependerá da confirmação do provedor de pagamento.</p></div><Link className="button button-primary" href="/">Preparar entrada <ViraIcon name="arrow-right" /></Link></div>
        </section>
        <section className="ranking-callout"><span className="eyebrow">CRITÉRIO DE ORDENAÇÃO</span><p>Maior lance confirmado ocupa a melhor posição. Em caso de empate, vale a confirmação mais antiga.</p><Link href="/termos">Ver regras completas <ViraIcon name="arrow-right" size={16} /></Link></section>
      </main>
      <ArenaFooter />
    </div>
  );
}
