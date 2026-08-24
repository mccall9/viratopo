"use client";

import { Dialog } from "@ark-ui/react/dialog";
import Link from "next/link";
import { FormEvent, useId, useRef, useState } from "react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon } from "@/components/vira-icon";
import {
  normalizeProductUrl,
  requestPaymentConfirmation,
  type PaymentStatus,
} from "@/lib/entry-flow.mjs";

type Flow = "entry" | "account" | "pix" | null;

const FLOW_STEPS: Record<Exclude<Flow, null>, number> = {
  entry: 1,
  account: 2,
  pix: 3,
};

const MIN_BID = 1;
const MAX_BID = 9_999;
const PIX_DEMO_CODE = "DEMONSTRACAO-VIRATOPO-SEM-COBRANCA";

const radarRules = [
  "Lance simulado a partir de R$ 1",
  "Posição por valor confirmado",
  "Desempate pela confirmação mais antiga",
  "Sem votação pública",
  "Métricas somente com atividade real",
];

export function HomeArena() {
  const inputId = useId();
  const inputHintId = `${inputId}-hint`;
  const inputErrorId = `${inputId}-error`;
  const flowUrlErrorId = useId();
  const flowEmailErrorId = useId();
  const copyErrorId = useId();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const flowUrlRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const heroSubmitRef = useRef<HTMLButtonElement>(null);

  const [flow, setFlow] = useState<Flow>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bid, setBid] = useState(MIN_BID);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");

  const formattedBid = `R$ ${bid.toLocaleString("pt-BR")}`;

  const closeFlow = () => {
    setFlow(null);
    setUrlError("");
    setEmailError("");
    setCopyError("");
  };

  const openFlow = (nextFlow: Exclude<Flow, null>) => {
    setUrlError("");
    setEmailError("");
    setCopied(false);
    setCopyError("");
    setFlow(nextFlow);
  };

  const validateUrl = (field: HTMLInputElement | null) => {
    const normalized = normalizeProductUrl(url);
    if (!normalized) {
      setUrlError("Informe um endereço válido, como produto.com.br.");
      requestAnimationFrame(() => field?.focus());
      return false;
    }
    setUrl(normalized);
    setUrlError("");
    return true;
  };

  const startFromHero = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateUrl(heroInputRef.current)) openFlow("account");
  };

  const continueToAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateUrl(flowUrlRef.current)) openFlow("account");
  };

  const continueToPix = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Informe um e-mail de teste válido para continuar.");
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    setEmailError("");
    openFlow("pix");
  };

  const copyPix = async () => {
    setCopyError("");
    setCopying(true);
    try {
      await navigator.clipboard.writeText(PIX_DEMO_CODE);
      setCopied(true);
    } catch {
      setCopyError("Não foi possível copiar. Selecione o código manualmente.");
    } finally {
      setCopying(false);
    }
  };

  const registerDemoPayment = () => {
    setPaymentStatus(requestPaymentConfirmation);
    closeFlow();
    requestAnimationFrame(() => heroSubmitRef.current?.focus());
  };

  const dismissNotice = () => {
    setPaymentStatus("idle");
    requestAnimationFrame(() => heroSubmitRef.current?.focus());
  };

  return (
    <div className="arena-app">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <ArenaNav active="board" />

      <main id="conteudo">
        <section className="season-rail" aria-label="Status da temporada">
          <span>Temporada sem entradas</span>
          <p>Pagamentos reais ainda não estão ativos.</p>
          <Link href="/termos">
            Entenda as regras <ViraIcon name="arrow-right" size={15} />
          </Link>
        </section>

        <section className="lance-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="eyebrow">RANKING PÚBLICO PARA PRODUTOS</span>
              <span className="hero-mobile-status">MVP EM PRÉ-LANÇAMENTO</span>
            </div>
            <h1 id="hero-title">
              <span>Coloque seu produto no topo.</span>
              <em>A disputa começa em R$ 1.</em>
            </h1>
            <p>
              Prepare um lance e teste como sua entrada funcionará. Sem votos,
              algoritmo oculto ou números inventados.
            </p>
          </div>

          <div className="hero-radar">
            <div className="radar-geometry" aria-hidden="true">
              <span className="radar-axis radar-axis-horizontal" />
              <span className="radar-axis radar-axis-vertical" />
              <span className="radar-ring radar-ring-outer" />
              <span className="radar-ring radar-ring-inner" />
            </div>

            <ul className="radar-rules" aria-label="Regras principais da disputa">
              {radarRules.map((rule, index) => (
                <li key={rule} className={`radar-rule radar-rule-${index + 1}`}>
                  <span aria-hidden="true" />
                  {rule}
                </li>
              ))}
            </ul>

            <div className="hero-console">
              <form
                className="quick-entry"
                onSubmit={startFromHero}
                noValidate
                aria-label="Preparar entrada no ranking"
              >
                <div className="hero-console-grid">
                  <div className="field field-product">
                    <label className="sr-only" htmlFor={inputId}>
                      Endereço do produto
                    </label>
                    <div className="input-shell">
                      <ViraIcon name="link" size={17} />
                      <input
                        ref={heroInputRef}
                        id={inputId}
                        value={url}
                        onChange={(event) => {
                          setUrl(event.target.value);
                          setUrlError("");
                        }}
                        placeholder="site do seu produto"
                        autoComplete="url"
                        inputMode="url"
                        aria-invalid={Boolean(urlError)}
                        aria-describedby={`${inputHintId}${urlError ? ` ${inputErrorId}` : ""}`}
                      />
                    </div>
                  </div>

                  <fieldset className="hero-bid">
                    <legend className="sr-only">Lance simulado, mínimo de R$ 1</legend>
                    <div>
                      <button
                        type="button"
                        onClick={() => setBid((value) => Math.max(MIN_BID, value - 1))}
                        aria-label="Diminuir lance"
                        disabled={bid === MIN_BID}
                      >
                        <ViraIcon name="minus" />
                      </button>
                      <output aria-live="polite">{formattedBid}</output>
                      <button
                        type="button"
                        onClick={() => setBid((value) => Math.min(MAX_BID, value + 1))}
                        aria-label="Aumentar lance"
                        disabled={bid === MAX_BID}
                      >
                        <ViraIcon name="plus" />
                      </button>
                    </div>
                  </fieldset>

                  <button
                    ref={heroSubmitRef}
                    className="button button-primary hero-submit"
                    type="submit"
                  >
                    Preparar entrada <ViraIcon name="arrow-right" />
                  </button>
                </div>

                <small id={inputHintId} className="field-hint">
                  Use o mesmo endereço para aumentar um lance existente.
                </small>
                {urlError && (
                  <small id={inputErrorId} className="field-error" role="alert">
                    {urlError}
                  </small>
                )}
              </form>
            </div>
          </div>
        </section>

        {paymentStatus === "confirmation-pending" && (
          <section className="inline-notice" role="status">
            <ViraIcon name="check" />
            <div>
              <strong>Simulação concluída.</strong>
              <p>
                Nenhuma cobrança ou entrada real foi criada. A produção só
                publicará uma posição após confirmação do provedor.
              </p>
            </div>
            <button type="button" onClick={dismissNotice}>
              Fechar
            </button>
          </section>
        )}

        <section className="lance-status" aria-label="Resumo da temporada">
          <article>
            <span>PRÓXIMA ENTRADA</span>
            <strong>Nenhum produto confirmado.</strong>
            <p>A primeira confirmação inaugura a posição número 1.</p>
          </article>
          <article>
            <span>ATIVIDADE RECENTE</span>
            <strong>A temporada ainda não começou.</strong>
            <p>Entradas e mudanças de posição aparecerão aqui.</p>
          </article>
        </section>

        <section className="lance-board" aria-labelledby="board-title">
          <header className="board-heading">
            <div>
              <span className="eyebrow">QUADRO</span>
              <h2 id="board-title">Ranking sem preenchimento artificial.</h2>
            </div>
            <Link href="/ranking">
              Abrir ranking completo <ViraIcon name="arrow-right" size={16} />
            </Link>
          </header>
          <div className="board-empty">
            <span className="empty-position tabular">#1</span>
            <div>
              <strong>O primeiro lugar está disponível.</strong>
              <p>
                Quando um pagamento real for integrado e confirmado, o produto
                aparecerá aqui.
              </p>
            </div>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => openFlow("entry")}
            >
              Preparar entrada <ViraIcon name="arrow-right" />
            </button>
          </div>
        </section>

        <section className="lance-explainer" aria-labelledby="explainer-title">
          <div>
            <span className="eyebrow">COMO FUNCIONA</span>
            <h2 id="explainer-title">
              Posição comprada.
              <br />
              Critério publicado.
            </h2>
          </div>
          <div>
            <p>
              ViraTopo é um ranking público de produtos digitais brasileiros. A
              posição é definida pelo valor de cada lance confirmado, com
              desempate pela confirmação mais antiga. Exibições e cliques só são
              publicados quando existem dados reais.
            </p>
            <p className="demo-note">
              O checkout PIX deste MVP é demonstrativo e não realiza cobrança.
            </p>
          </div>
        </section>
      </main>

      <ArenaFooter />

      <Dialog.Root
        open={flow !== null}
        onOpenChange={({ open }) => {
          if (!open) closeFlow();
        }}
        lazyMount
        unmountOnExit
      >
        <Dialog.Backdrop className="flow-backdrop" />
        <Dialog.Positioner className="flow-positioner">
          <Dialog.Content className="flow-panel">
            {flow && (
              <span className="flow-progress tabular">
                ETAPA {FLOW_STEPS[flow]} DE 3
              </span>
            )}

            {flow === "entry" && (
              <>
                <Dialog.Title>Comece pelo endereço.</Dialog.Title>
                <Dialog.Description>
                  O endereço será validado apenas neste navegador. Nenhuma entrada
                  será criada.
                </Dialog.Description>
                <form onSubmit={continueToAccount} noValidate>
                  <label htmlFor="flow-url">Endereço do produto</label>
                  <input
                    ref={flowUrlRef}
                    id="flow-url"
                    value={url}
                    onChange={(event) => {
                      setUrl(event.target.value);
                      setUrlError("");
                    }}
                    placeholder="https://seuproduto.com.br"
                    autoFocus
                    autoComplete="url"
                    inputMode="url"
                    aria-invalid={Boolean(urlError)}
                    aria-describedby={urlError ? flowUrlErrorId : undefined}
                  />
                  {urlError && (
                    <small id={flowUrlErrorId} className="field-error" role="alert">
                      {urlError}
                    </small>
                  )}
                  <button className="button button-primary full" type="submit">
                    Continuar <ViraIcon name="arrow-right" />
                  </button>
                </form>
              </>
            )}

            {flow === "account" && (
              <>
                <Dialog.Title>Identificação demonstrativa.</Dialog.Title>
                <Dialog.Description>
                  Use um e-mail de teste. Nada será enviado ou armazenado neste MVP.
                </Dialog.Description>
                <form onSubmit={continueToPix} noValidate>
                  <label htmlFor="flow-email">E-mail de teste</label>
                  <input
                    ref={emailRef}
                    id="flow-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                    }}
                    placeholder="teste@empresa.com"
                    autoFocus
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? flowEmailErrorId : undefined}
                  />
                  {emailError && (
                    <small id={flowEmailErrorId} className="field-error" role="alert">
                      {emailError}
                    </small>
                  )}
                  <div className="bid-summary">
                    <span>Lance preparado</span>
                    <strong className="tabular">{formattedBid}</strong>
                  </div>
                  <button className="button button-primary full" type="submit">
                    Ver demonstração PIX <ViraIcon name="arrow-right" />
                  </button>
                </form>
              </>
            )}

            {flow === "pix" && (
              <>
                <Dialog.Title>PIX demonstrativo.</Dialog.Title>
                <Dialog.Description>
                  O texto abaixo é inválido para pagamento e serve apenas para
                  testar a interface.
                </Dialog.Description>
                <div className="pix-receipt">
                  <span className="tabular">PIX</span>
                  <div>
                    <small>VALOR DA SIMULAÇÃO</small>
                    <strong className="tabular">{formattedBid}</strong>
                    <p>Nenhuma entrada será publicada.</p>
                  </div>
                </div>
                <label htmlFor="pix-code">Código inválido para pagamento</label>
                <textarea
                  id="pix-code"
                  className="pix-code"
                  value={PIX_DEMO_CODE}
                  readOnly
                  rows={2}
                />
                <button
                  className={`button button-secondary full ${copied ? "is-confirmed" : ""}`}
                  type="button"
                  onClick={copyPix}
                  autoFocus
                  disabled={copying}
                  aria-describedby={copyError ? copyErrorId : undefined}
                >
                  {copying ? (
                    "Copiando…"
                  ) : copied ? (
                    <>
                      <ViraIcon name="check" /> Código copiado
                    </>
                  ) : (
                    <>
                      <ViraIcon name="copy" /> Copiar código
                    </>
                  )}
                </button>
                {copyError && (
                  <small id={copyErrorId} className="field-error" role="alert">
                    {copyError}
                  </small>
                )}
                <button
                  className="button button-primary full"
                  type="button"
                  onClick={registerDemoPayment}
                >
                  Simular confirmação <ViraIcon name="arrow-right" />
                </button>
              </>
            )}

            <Dialog.CloseTrigger className="icon-close" aria-label="Fechar">
              <ViraIcon name="x" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}
