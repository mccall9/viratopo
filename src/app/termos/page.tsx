import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Regras e termos de uso", description: "Regras do ranking ViraTopo, conteúdo aceito e condições do fluxo PIX demonstrativo, que não realiza cobranças.", path: "/termos" });

export default function TermsPage() {
  return (
    <div className="arena-app">
      <a className="skip" href="#termos-conteudo">Pular para os termos</a>
      <ArenaNav active="rules" />
      <main><article className="policy-shell" id="termos-conteudo"><header className="policy-header"><span className="eyebrow">TERMOS DE USO</span><h1>Visibilidade não é promessa de venda.</h1><p>Estas condições definem o uso do quadro e do ranking público.</p><small>Última atualização: 24 de agosto de 2026</small></header><div className="policy-layout"><aside aria-label="Neste documento"><span>NESTE DOCUMENTO</span><a href="#regra-ranking">Ranking</a><a href="#produtos-aceitos">Conteúdo</a><a href="#pagamentos">Pagamentos</a><a href="#mudancas">Mudanças</a></aside><div className="policy-content prose"><section id="regra-ranking"><h2>1. O ranking</h2><p>O ranking ordenará produtos por lances confirmados dentro de uma temporada. Uma posição compra exposição no produto; ela não garante cliques, receita, vendas ou conversão. Empates serão decididos pela confirmação mais antiga.</p></section><section id="produtos-aceitos"><h2>2. Produtos aceitos</h2><p>Não aceitamos produtos ilegais, enganosos, fraudulentos ou que violem direitos de terceiros. Uma entrada poderá ser recusada ou removida quando comprometer a segurança e a confiança do serviço.</p></section><section id="pagamentos"><h2>3. Pagamentos</h2><p>O MVP possui apenas uma simulação de PIX e não efetua cobrança. Quando pagamentos reais forem disponibilizados, preço, confirmação, cancelamento e reembolso serão apresentados antes da contratação.</p></section><section id="mudancas"><h2>4. Mudanças nestes termos</h2><p>Estes termos poderão ser atualizados quando o serviço evoluir. A versão vigente ficará nesta página, acompanhada da data de atualização.</p></section></div></div></article></main>
      <ArenaFooter />
    </div>
  );
}
