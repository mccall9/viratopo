import Link from "next/link";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon, type ViraIconName } from "@/components/vira-icon";
import { getPublicRanking } from "@/lib/public-ranking";
import { createPageMetadata } from "@/lib/site-metadata";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Estatísticas e metodologia",
  description: "Veja quais métricas o ViraTopo publica, como serão contadas e por que números ausentes nunca são substituídos por dados fictícios.",
  path: "/analytics",
});

const number = new Intl.NumberFormat("pt-BR");

export default async function AnalyticsPage() {
  const ranking = await getPublicRanking();
  const hasCompleteImpressions = ranking.state === "ready" && ranking.entries.length > 0 && ranking.entries.every((entry) => entry.impressions !== null);
  const hasCompleteClicks = ranking.state === "ready" && ranking.entries.length > 0 && ranking.entries.every((entry) => entry.clicks !== null);
  const values = {
    entries: ranking.state === "ready" ? ranking.entries.length : null,
    impressions: hasCompleteImpressions ? ranking.entries.reduce((total, entry) => total + (entry.impressions ?? 0), 0) : null,
    clicks: hasCompleteClicks ? ranking.entries.reduce((total, entry) => total + (entry.clicks ?? 0), 0) : null,
  };
  const metrics: Array<{ label: string; icon: ViraIconName; value: number | null }> = [
    { label: "Entradas confirmadas", icon: "receipt", value: values.entries },
    { label: "Exibições válidas", icon: "eye", value: values.impressions },
    { label: "Cliques externos", icon: "pointer", value: values.clicks },
  ];
  const collectionStatus = values.impressions === null && values.clicks === null
    ? { value: "Desativada", note: ranking.state === "unavailable" ? "fonte indisponível" : "pré-lançamento" }
    : { value: "Ativa", note: "dados da temporada atual" };

  return (
    <div className="arena-app">
      <a className="skip" href="#dados">Pular para os dados</a>
      <ArenaNav active="analytics" />
      <main>
        <section className="page-head" id="dados">
          <div>
            <span className="eyebrow">ESTATÍSTICAS PÚBLICAS</span>
            <h1>Sem medição, sem número.</h1>
            <p>{collectionStatus.value === "Ativa" ? "Os totais abaixo vêm da temporada atual e seguem os critérios públicos de contagem." : "A coleta ainda não está ativa. Os espaços permanecem indisponíveis até existirem eventos reais e auditáveis."}</p>
          </div>
          <div className="page-status"><span>COLETA</span><strong>{collectionStatus.value}</strong><small>{collectionStatus.note}</small></div>
        </section>
        <dl className="metric-row">
          {metrics.map(({ label, icon, value }) => (
            <div key={label}>
              <dt><ViraIcon name={icon} size={18} />{label}</dt>
              <dd aria-label={value === null ? "Dado indisponível" : undefined}>{value === null ? "—" : number.format(value)}</dd>
              <small>{value === null ? "aguardando coleta real" : "temporada atual"}</small>
            </div>
          ))}
        </dl>
        <section className="data-stage">
          <div><span className="eyebrow">METODOLOGIA PREPARADA</span><h2>Critérios antes<br />dos contadores.</h2></div>
          <div className="data-empty prose">
            <h3>Entrada confirmada</h3>
            <p>Um produto único com pagamento aprovado pelo provedor dentro da temporada. Reenvios do mesmo evento não aumentam o total.</p>
            <h3>Exibição válida</h3>
            <p>Será contada quando ao menos metade do cartão permanecer visível por um segundo. Repetições do mesmo visitante, produto e dia serão deduplicadas; tráfego automatizado será excluído.</p>
            <h3>Clique externo</h3>
            <p>Será contado na ativação voluntária do link do produto, com deduplicação por visitante, produto e janela de 30 minutos.</p>
            <p><strong>Importante:</strong> esta metodologia será implementada e testada antes de qualquer contador ser publicado. Até lá, “—” significa indisponível, não zero.</p>
            <Link href="/ranking">Ir ao ranking <ViraIcon name="arrow-right" /></Link>
          </div>
        </section>
      </main>
      <ArenaFooter />
    </div>
  );
}
