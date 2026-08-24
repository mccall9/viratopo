import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({ title: "Política de privacidade", description: "Conheça o estágio atual do MVP ViraTopo e como dados de conta, produto, métricas e pagamentos poderão ser tratados no futuro.", path: "/privacidade" });

export default function PrivacyPage() {
  return (
    <div className="arena-app">
      <a className="skip" href="#privacidade-conteudo">Pular para a privacidade</a>
      <ArenaNav />
      <main><article className="policy-shell" id="privacidade-conteudo"><header className="policy-header"><span className="eyebrow">PRIVACIDADE</span><h1>Dados só quando forem necessários.</h1><p>Esta política explica o estágio atual do MVP e como o tratamento funcionará quando houver operação real.</p><small>Última atualização: 24 de agosto de 2026</small></header><div className="policy-layout"><aside aria-label="Neste documento"><span>NESTE DOCUMENTO</span><a href="#estagio">Estágio atual</a><a href="#coleta">Coleta</a><a href="#uso">Uso</a><a href="#terceiros">Terceiros</a></aside><div className="policy-content prose"><section id="estagio"><h2>1. Estágio atual</h2><p>O fluxo publicado é demonstrativo: não cria conta, não persiste e-mail ou endereço do produto e não processa pagamento. Não informe uma senha real em nenhum campo do MVP.</p></section><section id="coleta"><h2>2. Coleta futura</h2><p>Antes do lançamento comercial, esta política será atualizada com o canal de contato, o responsável pelo tratamento e a lista exata de dados necessários para operar o ranking e prevenir abuso.</p></section><section id="uso"><h2>3. Finalidades previstas</h2><p>Quando a operação estiver ativa, dados poderão ser usados para identificar entradas, ordenar posições confirmadas, entregar métricas documentadas e manter a segurança do serviço. Nenhum dado pessoal será vendido.</p></section><section id="terceiros"><h2>4. Pagamentos e terceiros</h2><p>O PIX atual é apenas uma simulação. Uma integração futura exibirá o provedor e a política aplicável antes de qualquer envio de dado financeiro.</p></section></div></div></article></main>
      <ArenaFooter />
    </div>
  );
}
