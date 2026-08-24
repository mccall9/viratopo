"use client";

import { Dialog } from "@ark-ui/react/dialog";
import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon } from "@/components/vira-icon";
import { normalizeProductUrl, requestPaymentConfirmation, type PaymentStatus } from "@/lib/entry-flow.mjs";

type Flow = "entry" | "account" | "pix" | null;
const FLOW_STEPS: Record<Exclude<Flow, null>, number> = { entry: 1, account: 2, pix: 3 };
const PIX_DEMO_CODE = "00020101021226880014BR.GOV.BCB.PIX2566demonstracao.viratopo.local52040000530398654041.005802BR5920VIRATOPO DEMO6009FORTALEZA62070503***6304DEMO";

export function HomeArena() {
  const inputId = useId();
  const [flow, setFlow] = useState<Flow>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bid, setBid] = useState(1);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");

  const closeFlow = () => setFlow(null);

  const validateUrl = () => {
    const normalized = normalizeProductUrl(url);
    if (!normalized) {
      setUrlError("Informe um endereço válido, como produto.com.br.");
      return false;
    }
    setUrl(normalized);
    setUrlError("");
    return true;
  };

  const startFromHero = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateUrl()) setFlow("account");
  };

  const continueToAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateUrl()) setFlow("account");
  };

  const continueToPix = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Informe um e-mail válido para continuar.");
      return;
    }
    setEmailError("");
    setFlow("pix");
  };

  const copyPix = async () => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(PIX_DEMO_CODE);
      setCopied(true);
    } catch {
      setCopyError("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  const registerDemoPayment = () => {
    setPaymentStatus(requestPaymentConfirmation);
    closeFlow();
  };

  return (
    <div className="arena-app">
      <a className="skip" href="#conteudo">Pular para o conteúdo</a>
      <ArenaNav active="board" />

      <main id="conteudo">
        <section className="season-rail" aria-label="Status da temporada">
          <span>Pré-lançamento</span>
          <p>O ranking abre com a primeira confirmação real.</p>
          <Link href="/termos">Entenda as regras <ViraIcon name="arrow-right" size={15} /></Link>
        </section>

        <section className="lance-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">RANKING PÚBLICO PARA PRODUTOS</span>
            <h1 id="hero-title">Coloque seu produto no topo.</h1>
            <p>Defina o lance e veja a posição correspondente. Sem votos, algoritmo oculto ou números inventados.</p>
          </div>

          <div className="hero-action">
            <fieldset className="hero-bid">
              <legend>Lance de entrada</legend>
              <div role="group" aria-label="Ajustar lance de entrada">
                <button type="button" onClick={() => setBid((value) => Math.max(1, value - 1))} aria-label="Diminuir lance"><ViraIcon name="minus" /></button>
                <output aria-live="polite">R$ {bid}</output>
                <button type="button" onClick={() => setBid((value) => value + 1)} aria-label="Aumentar lance"><ViraIcon name="plus" /></button>
              </div>
            </fieldset>

            <form className="quick-entry" onSubmit={startFromHero} noValidate>
              <div className="field">
                <label htmlFor={inputId}>Endereço do produto</label>
                <div className="input-shell"><ViraIcon name="link" size={17} /><input id={inputId} value={url} onChange={(event) => { setUrl(event.target.value); setUrlError(""); }} placeholder="seuproduto.com.br" autoComplete="url" inputMode="url" aria-invalid={Boolean(urlError)} aria-describedby={urlError ? `${inputId}-error` : `${inputId}-hint`} /></div>
                <small id={urlError ? `${inputId}-error` : `${inputId}-hint`} className={urlError ? "field-error" : "field-hint"}>{urlError || "Use o mesmo endereço para aumentar um lance existente."}</small>
              </div>
              <button className="button button-primary" type="submit">Entrar no ranking <ViraIcon name="arrow-right" /></button>
            </form>
          </div>
        </section>

        {paymentStatus === "confirmation-pending" && (
          <section className="inline-notice" role="status">
            <ViraIcon name="check" />
            <div><strong>Simulação concluída.</strong><p>Nenhuma cobrança ou entrada real foi criada. A produção só publicará uma posição após confirmação do provedor.</p></div>
            <button type="button" onClick={() => setPaymentStatus("idle")}>Fechar</button>
          </section>
        )}

        <section className="lance-status" aria-label="Resumo da temporada">
          <article><span>PRÓXIMA ENTRADA</span><strong>Nenhum produto confirmado.</strong><p>A primeira confirmação inaugura a posição número 1.</p></article>
          <article><span>ATIVIDADE RECENTE</span><strong>A temporada ainda não começou.</strong><p>Entradas e mudanças de posição aparecerão aqui.</p></article>
        </section>

        <section className="lance-board" aria-labelledby="board-title">
          <header className="board-heading"><div><span className="eyebrow">QUADRO</span><h2 id="board-title">Ranking sem preenchimento artificial.</h2></div><Link href="/ranking">Abrir ranking completo <ViraIcon name="arrow-right" size={16} /></Link></header>
          <div className="board-empty">
            <span className="empty-position tabular">#1</span>
            <div><strong>O primeiro lugar está disponível.</strong><p>Quando um pagamento real for integrado e confirmado, o produto aparece aqui.</p></div>
            <button className="button button-secondary" type="button" onClick={() => setFlow("entry")}>Preparar entrada <ViraIcon name="arrow-right" /></button>
          </div>
        </section>

        <section className="lance-explainer" aria-labelledby="explainer-title">
          <div><span className="eyebrow">COMO FUNCIONA</span><h2 id="explainer-title">Posição comprada.<br />Critério publicado.</h2></div>
          <div><p>ViraTopo é um ranking público de produtos digitais brasileiros. A posição é definida pelo valor de cada lance confirmado, com desempate pela confirmação mais antiga. Exibições e cliques só são publicados quando existem dados reais.</p><p className="demo-note">O checkout PIX deste MVP é demonstrativo e não realiza cobrança.</p></div>
        </section>
      </main>

      <ArenaFooter />

      <Dialog.Root open={flow !== null} onOpenChange={({ open }) => { if (!open) closeFlow(); }} lazyMount unmountOnExit>
        <Dialog.Backdrop className="flow-backdrop" />
        <Dialog.Positioner className="flow-positioner">
          <Dialog.Content className="flow-panel">
            {flow && <span className="flow-progress tabular">ETAPA {FLOW_STEPS[flow]} DE 3</span>}

            {flow === "entry" && <><Dialog.Title>Comece pelo endereço.</Dialog.Title><Dialog.Description>Vamos identificar o produto antes de calcular a entrada.</Dialog.Description><form onSubmit={continueToAccount} noValidate><label htmlFor="flow-url">Endereço do produto</label><input id="flow-url" value={url} onChange={(event) => { setUrl(event.target.value); setUrlError(""); }} placeholder="https://seuproduto.com.br" autoFocus autoComplete="url" inputMode="url" aria-invalid={Boolean(urlError)} />{urlError && <small className="field-error">{urlError}</small>}<button className="button button-primary full" type="submit">Continuar <ViraIcon name="arrow-right" /></button></form></>}

            {flow === "account" && <><Dialog.Title>Onde enviamos o status?</Dialog.Title><Dialog.Description>Não peça senha aqui. No produto real, este e-mail receberá um link seguro para acompanhar a entrada.</Dialog.Description><form onSubmit={continueToPix} noValidate><label htmlFor="flow-email">Seu e-mail</label><input id="flow-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(""); }} placeholder="voce@empresa.com" autoFocus autoComplete="email" aria-invalid={Boolean(emailError)} />{emailError && <small className="field-error">{emailError}</small>}<div className="bid-summary"><span>Lance preparado</span><strong className="tabular">R$ {bid}</strong></div><button className="button button-primary full" type="submit">Ver demonstração PIX <ViraIcon name="arrow-right" /></button></form></>}

            {flow === "pix" && <><Dialog.Title>PIX demonstrativo.</Dialog.Title><Dialog.Description>Este código serve apenas para testar a interface. Ele não gera cobrança.</Dialog.Description><div className="pix-receipt"><span className="tabular">PIX</span><div><small>VALOR DA SIMULAÇÃO</small><strong className="tabular">R$ {bid}</strong><p>Nenhuma entrada será publicada.</p></div></div><label htmlFor="pix-code">Código de demonstração</label><textarea id="pix-code" className="pix-code" value={PIX_DEMO_CODE} readOnly rows={3} /><button className={`button button-secondary full ${copied ? "is-confirmed" : ""}`} type="button" onClick={copyPix}>{copied ? <><ViraIcon name="check" /> Código copiado</> : <><ViraIcon name="copy" /> Copiar código</>}</button>{copyError && <small className="field-error">{copyError}</small>}<button className="button button-primary full" type="button" onClick={registerDemoPayment}>Simular confirmação <ViraIcon name="arrow-right" /></button></>}
            <Dialog.CloseTrigger className="icon-close" aria-label="Fechar"><ViraIcon name="x" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}
