import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Política de privacidade",
  description: "Saiba quais dados o ViraTopo usa no pré-lançamento, para quê, e quais integrações ainda permanecem desativadas.",
  path: "/privacidade",
});

export default function PrivacyPage() {
  const controllerName = process.env.LEGAL_CONTROLLER_NAME?.trim();
  const contactEmail = process.env.LEGAL_CONTACT_EMAIL?.trim();
  return (
    <div className="arena-app">
      <a className="skip" href="#privacidade-conteudo">Pular para a privacidade</a>
      <ArenaNav />
      <main>
        <article className="policy-shell" id="privacidade-conteudo">
          <header className="policy-header">
            <span className="eyebrow">PRIVACIDADE</span>
            <h1>Coletar menos também é uma decisão de produto.</h1>
            <p>Durante o pré-lançamento, o ViraTopo mantém pagamentos e rastreamento de visibilidade desativados.</p>
            <small>Última atualização: 24 de agosto de 2026</small>
          </header>
          <div className="policy-layout">
            <aside aria-label="Neste documento">
              <span>NESTE DOCUMENTO</span>
              <a href="#prelancamento">Pré-lançamento</a>
              <a href="#dados">Dados</a>
              <a href="#uso">Finalidades</a>
              <a href="#terceiros">Operadores</a>
              <a href="#direitos">Seus direitos</a>
            </aside>
            <div className="policy-content prose">
              <section id="prelancamento">
                <h2>1. Estado atual</h2>
                <p>Não há checkout ativo e nenhum dado informado pelo navegador confirma uma posição. O pré-cadastro só será persistido quando a infraestrutura privada e um canal público de atendimento estiverem configurados; caso contrário, o formulário informa indisponibilidade sem simular sucesso.</p>
              </section>
              <section id="dados">
                <h2>2. Dados do pré-cadastro</h2>
                <p>Quando habilitado, o formulário envia e-mail, endereço do produto, lance pretendido e consentimento. Para limitar abuso, o servidor transforma o endereço IP em um identificador HMAC usado numa janela horária; registros antigos são removidos oportunisticamente em novas submissões e o IP bruto não é salvo pela aplicação. Um campo invisível de proteção contra robôs também poderá ser usado. Não solicitamos senha, chave PIX, cartão ou documento nessa etapa.</p>
              </section>
              <section id="uso">
                <h2>3. Para que usamos</h2>
                <p>Esses dados servem para validar interesse, avisar sobre o lançamento, preparar a entrada solicitada e prevenir abuso. Não vendemos dados pessoais e não usamos o pré-cadastro para confirmar pagamento ou posição.</p>
              </section>
              <section id="terceiros">
                <h2>4. Infraestrutura e pagamentos</h2>
                <p>A aplicação é hospedada na Vercel e foi preparada para armazenar o pré-cadastro no Supabase. Esses serviços podem processar dados técnicos para entregar e proteger a aplicação. O provedor de pagamento e suas condições serão identificados antes da ativação do PIX.</p>
              </section>
              <section id="direitos">
                <h2>5. Acesso e exclusão</h2>
                {controllerName && contactEmail ? (
                  <p>O controlador destes dados é {controllerName}. Para solicitar acesso, correção ou exclusão, escreva para <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Pré-cadastros serão mantidos por até 12 meses ou excluídos antes mediante solicitação.</p>
                ) : (
                  <p>Antes de iniciar qualquer coleta persistente, publicaremos o nome do controlador dos dados e um canal de contato. Pré-cadastros serão mantidos por até 12 meses ou excluídos antes mediante solicitação. Até ambos serem configurados, o servidor de produção mantém o pré-cadastro desabilitado.</p>
                )}
              </section>
            </div>
          </div>
        </article>
      </main>
      <ArenaFooter />
    </div>
  );
}
