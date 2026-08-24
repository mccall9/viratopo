import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { formatBid, RANKING_RULES } from "@/lib/ranking-rules";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Regras do ranking",
  description: "Entenda duração da temporada, valores, ordenação, desempate, moderação e pagamentos do ViraTopo.",
  path: "/termos",
});

export default function TermsPage() {
  return (
    <div className="arena-app">
      <a className="skip" href="#termos-conteudo">Pular para as regras</a>
      <ArenaNav active="rules" />
      <main>
        <article className="policy-shell" id="termos-conteudo">
          <header className="policy-header">
            <span className="eyebrow">REGRAS DO QUADRO</span>
            <h1>Uma disputa simples precisa de regras precisas.</h1>
            <p>Este é o contrato público do ranking. Pagamentos permanecem desativados durante o pré-lançamento.</p>
            <small>Última atualização: 24 de agosto de 2026</small>
          </header>
          <div className="policy-layout">
            <aside aria-label="Neste documento">
              <span>NESTE DOCUMENTO</span>
              <a href="#temporada">Temporada</a>
              <a href="#ordenacao">Ordenação</a>
              <a href="#conteudo">Conteúdo</a>
              <a href="#pagamentos">Pagamentos</a>
              <a href="#metricas">Métricas</a>
            </aside>
            <div className="policy-content prose">
              <section id="temporada">
                <h2>1. Temporada e valores</h2>
                <p>Cada temporada é aberta pelo servidor e dura {RANKING_RULES.cycleHours} horas consecutivas. A primeira confirmação válida inaugura o #1. O lance declarado deve ficar entre {formatBid(RANKING_RULES.minimumBidCents)} e {formatBid(RANKING_RULES.maximumBidCents)}, em passos inteiros de R$ 1.</p>
                <p>Um produto que já esteja no quadro paga apenas a diferença positiva entre o lance confirmado atual e o novo valor declarado. O resumo exibido antes do pagamento sempre discriminará lance anterior, novo lance e valor devido.</p>
              </section>
              <section id="ordenacao">
                <h2>2. Posição e desempate</h2>
                <p>Cada produto ocupa no máximo uma posição por temporada. O maior lance total confirmado fica acima. Em valores iguais, vence a confirmação mais antiga registrada pelo servidor. Um lance pendente, recusado, expirado, estornado ou informado apenas pelo navegador não altera o ranking.</p>
                <p>A posição pode mudar até o encerramento da temporada. Comprar visibilidade não garante duração mínima no topo, cliques, receita, vendas ou conversão.</p>
              </section>
              <section id="conteudo">
                <h2>3. Produtos e moderação</h2>
                <p>O endereço deve ser público, seguro e representar o produto anunciado. Conteúdo ilegal, fraudulento, enganoso, malicioso, adulto sem sinalização adequada ou que viole direitos de terceiros poderá ser recusado ou removido. A moderação não altera o valor de um lance para favorecer participantes.</p>
              </section>
              <section id="pagamentos">
                <h2>4. Pagamentos</h2>
                <p>O ViraTopo ainda não recebe pagamentos. O formulário atual registra somente interesse no lançamento e nunca deve exibir uma entrada como confirmada.</p>
                <p>Quando o PIX for ativado, a cobrança será criada no servidor com um provedor identificado. A entrada só aparecerá após confirmação assinada do provedor. Expiração, duplicidade, cancelamento, contestação e reembolso seguirão a legislação aplicável e as condições apresentadas antes da compra.</p>
              </section>
              <section id="metricas">
                <h2>5. Métricas públicas</h2>
                <p>Somente eventos efetivamente coletados serão publicados. A metodologia de impressão, clique, deduplicação e exclusão de tráfego automatizado fica disponível na página de Estatísticas. Contadores ausentes aparecem como indisponíveis, nunca como zero inventado.</p>
              </section>
              <section>
                <h2>6. Mudanças</h2>
                <p>Alterações materiais serão publicadas aqui com nova data de vigência. Nenhuma mudança retroativa modificará a ordenação de uma temporada já iniciada.</p>
              </section>
            </div>
          </div>
        </article>
      </main>
      <ArenaFooter />
    </div>
  );
}
