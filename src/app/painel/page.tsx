import Link from "next/link";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon } from "@/components/vira-icon";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Painel", description: "Área de acompanhamento das entradas do ViraTopo, disponível apenas quando houver uma operação real.", path: "/painel", index: false });

export default function PainelPage() {
  return (
    <div className="arena-app">
      <a className="skip" href="#painel">Pular para o painel</a>
      <ArenaNav />
      <main>
        <section className="page-head compact" id="painel"><div><span className="eyebrow">CENTRAL DO PRODUTO</span><h1>Seu espaço de controle.</h1><p>Acompanhe posição, lance e alertas depois que uma entrada real for confirmada.</p></div><Link className="button button-primary" href="/">Simular entrada <ViraIcon name="arrow-right" /></Link></section>
        <section className="panel-board" aria-label="Resumo do produto">
          <article className="panel-profile"><span className="eyebrow">PRODUTO CONECTADO</span><div className="profile-placeholder">VT</div><h2>Nenhum produto conectado.</h2><p>O endereço e o status aparecerão aqui após uma confirmação real.</p></article>
          <article className="panel-radar"><span className="eyebrow">SUA POSIÇÃO</span><div><ViraIcon name="radar" size={29} /><strong className="tabular">—</strong><p>A posição ainda não existe.</p></div></article>
          <article className="panel-alerts"><span className="eyebrow">ALERTAS</span><ul><li><ViraIcon name="bell" /> Avisos de posição aparecerão aqui.</li><li><ViraIcon name="gauge" /> Você saberá quando houver mudança.</li></ul></article>
        </section>
        <section className="panel-cta"><div><span className="eyebrow">PRÉ-LANÇAMENTO</span><h2>Simule um lance e entre na lista de lançamento.</h2></div><Link className="button button-primary" href="/">Abrir quadro <ViraIcon name="arrow-right" /></Link></section>
      </main>
      <ArenaFooter />
    </div>
  );
}
