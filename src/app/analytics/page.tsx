import Link from "next/link";
import { ArrowRight, Eye, MousePointer2, ReceiptText } from "lucide-react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";

const metrics = [{ label: "ENTRADAS CONFIRMADAS", icon: ReceiptText }, { label: "EXIBIÇÕES ENTREGUES", icon: Eye }, { label: "CLIQUES GERADOS", icon: MousePointer2 }];
export default function AnalyticsPage() {
  return <main className="arena-app"><a className="skip" href="#dados">Pular para dados</a><ArenaNav active="analytics" /><section className="page-head" id="dados"><div><span className="kicker"><i /> DADOS DA ARENA</span><h1>Dados que<br /><em>começam do zero.</em></h1><p>Esta tela se torna pública quando a temporada receber a primeira entrada confirmada.</p></div><div className="data-status"><i /><b>Coleta preparada</b><span>Sem registros ainda</span></div></section><section className="metric-row">{metrics.map(({ label, icon: Icon }) => <article key={label}><Icon size={17} /><span>{label}</span><strong>—</strong><small>aguardando dados reais</small></article>)}</section><section className="data-stage"><div><span className="card-label">LEITURA DE VISIBILIDADE</span><h2>Nada para inflar.<br />Nada para esconder.</h2></div><div className="data-empty"><div className="chart-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div><p>Quando houver atividade, o gráfico mostrará exibições e cliques por período, com os critérios de contagem documentados.</p><Link href="/ranking">Ir ao ranking <ArrowRight size={16} /></Link></div></section><ArenaFooter /></main>;
}
