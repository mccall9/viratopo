import Link from "next/link";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon, type ViraIconName } from "@/components/vira-icon";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Estatísticas públicas", description: "Critérios e métricas públicas do ranking ViraTopo, exibidas somente quando existem dados reais.", path: "/analytics" });
const metrics: Array<{ label: string; icon: ViraIconName }> = [{ label: "Entradas confirmadas", icon: "receipt" }, { label: "Exibições entregues", icon: "eye" }, { label: "Cliques gerados", icon: "pointer" }];

export default function AnalyticsPage() {
  return (
    <div className="arena-app">
      <a className="skip" href="#dados">Pular para os dados</a>
      <ArenaNav active="analytics" />
      <main>
        <section className="page-head" id="dados"><div><span className="eyebrow">ESTATÍSTICAS PÚBLICAS</span><h1>Os números começam do zero.</h1><p>Publicamos métricas apenas quando existe atividade mensurável. Nenhum contador é decorativo.</p></div><div className="page-status"><span>COLETA</span><strong>Preparada</strong><small>sem registros ainda</small></div></section>
        <dl className="metric-row">{metrics.map(({ label, icon }) => <div key={label}><dt><ViraIcon name={icon} size={18} />{label}</dt><dd>—</dd><small>aguardando dados reais</small></div>)}</dl>
        <section className="data-stage"><div><span className="eyebrow">LEITURA DE VISIBILIDADE</span><h2>Nada para inflar.<br />Nada para esconder.</h2></div><div className="data-empty"><span className="empty-mark tabular" aria-hidden="true">—</span><p>Quando houver atividade, esta área mostrará exibições e cliques por período, junto aos critérios de contagem.</p><Link href="/ranking">Ir ao ranking <ViraIcon name="arrow-right" /></Link></div></section>
      </main>
      <ArenaFooter />
    </div>
  );
}
