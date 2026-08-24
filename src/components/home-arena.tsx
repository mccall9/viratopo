"use client";

import { Dialog } from "@ark-ui/react/dialog";
import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon } from "@/components/vira-icon";
import { normalizeProductUrl } from "@/lib/entry-flow.mjs";
import type { PublicRankingResult } from "@/lib/public-ranking";
import { publicProductHref } from "@/lib/public-ranking-parser.mjs";
import { formatBid } from "@/lib/ranking-rules";

type Flow = "summary" | "waitlist" | null;
type WaitlistStatus = "idle" | "loading" | "success" | "error" | "unavailable";

const MIN_BID = 1;
const MAX_BID = 9_999;

const radarRules = [
  "Lance simulado a partir de R$ 1",
  "Posição por valor confirmado",
  "Desempate pela confirmação mais antiga",
  "Sem votação pública",
  "Métricas somente com atividade real",
];

export function HomeArena({ ranking }: { ranking: PublicRankingResult }) {
  const leader = ranking.entries[0] ?? null;
  const isReadyEmpty = ranking.state === "ready" && !leader;
  const leaderAtCeiling = Boolean(leader && leader.amountCents >= MAX_BID * 100);
  const nextTopBid = leader ? Math.min(MAX_BID, Math.floor(leader.amountCents / 100) + 1) : MIN_BID;
  const leaderHref = leader ? publicProductHref(leader.productUrl) : null;
  const inputId = useId();
  const inputHintId = `${inputId}-hint`;
  const inputErrorId = `${inputId}-error`;
  const flowEmailErrorId = useId();
  const flowConsentErrorId = useId();
  const waitlistFeedbackId = useId();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const summaryContinueRef = useRef<HTMLButtonElement>(null);
  const waitlistFeedbackRef = useRef<HTMLDivElement>(null);
  const heroSubmitRef = useRef<HTMLButtonElement>(null);
  const waitlistRequestRef = useRef<AbortController | null>(null);

  const [flow, setFlow] = useState<Flow>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [bid, setBid] = useState(nextTopBid);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [website, setWebsite] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("idle");

  useEffect(() => {
    if (["success", "error", "unavailable"].includes(waitlistStatus)) {
      waitlistFeedbackRef.current?.focus();
    }
  }, [waitlistStatus]);

  const formattedBid = `R$ ${bid.toLocaleString("pt-BR")}`;

  const closeFlow = () => {
    waitlistRequestRef.current?.abort();
    waitlistRequestRef.current = null;
    setFlow(null);
    setUrlError("");
    setEmailError("");
    setConsentError("");
  };

  const openSummary = () => {
    setUrlError("");
    setEmailError("");
    setConsent(false);
    setConsentError("");
    setWebsite("");
    setWaitlistStatus("idle");
    setFlow("summary");
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
    if (validateUrl(heroInputRef.current)) openSummary();
  };

  const continueToWaitlist = () => {
    setEmailError("");
    setConsentError("");
    setWaitlistStatus("idle");
    setFlow("waitlist");
    requestAnimationFrame(() => emailRef.current?.focus());
  };

  const returnToSummary = () => {
    setEmailError("");
    setConsentError("");
    setWaitlistStatus("idle");
    setFlow("summary");
    requestAnimationFrame(() => summaryContinueRef.current?.focus());
  };

  const focusHeroSimulator = () => {
    heroInputRef.current?.scrollIntoView({ block: "center" });
    requestAnimationFrame(() => heroInputRef.current?.focus());
  };

  const editSimulation = () => {
    closeFlow();
    focusHeroSimulator();
  };

  const submitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (waitlistStatus === "loading") return;

    const normalizedEmail = email.trim();
    const hasValidEmail = /^\S+@\S+\.\S+$/.test(normalizedEmail);
    setEmailError(hasValidEmail ? "" : "Informe um e-mail válido para entrar na lista.");
    setConsentError(consent ? "" : "Confirme que deseja receber os avisos de lançamento.");
    setWaitlistStatus("idle");

    if (!hasValidEmail) {
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    if (!consent) {
      requestAnimationFrame(() => consentRef.current?.focus());
      return;
    }

    const controller = new AbortController();
    waitlistRequestRef.current?.abort();
    waitlistRequestRef.current = controller;
    setWaitlistStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          productUrl: url,
          bidCents: bid * 100,
          consent,
          website,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.ok) {
        setWaitlistStatus("success");
      } else if (response.status === 503) {
        setWaitlistStatus("unavailable");
      } else {
        setWaitlistStatus("error");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setWaitlistStatus("error");
    } finally {
      if (waitlistRequestRef.current === controller) waitlistRequestRef.current = null;
    }
  };

  const finishWaitlist = () => {
    closeFlow();
    requestAnimationFrame(() => heroSubmitRef.current?.focus());
  };

  return (
    <div className="arena-app">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <ArenaNav active="board" />

      <main id="conteudo">
        <section className="lance-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="eyebrow">RANKING PÚBLICO PARA PRODUTOS</span>
              <span className="hero-mobile-status">{leader ? "TEMPORADA AO VIVO" : isReadyEmpty ? "SEM ENTRADAS RETORNADAS" : ranking.state === "unconfigured" ? "MVP EM PRÉ-LANÇAMENTO" : "DADOS INDISPONÍVEIS"}</span>
            </div>
            <h1 id="hero-title">
              <span>Coloque seu produto no topo.</span>
              <em>{leader ? leaderAtCeiling ? `O #1 atingiu o teto de ${formatBid(MAX_BID * 100)}.` : `Assuma o #1 por ${formatBid(nextTopBid * 100)}.` : "Simule uma entrada a partir de R$ 1."}</em>
            </h1>
            <p>
              Simule um lance e veja como sua entrada funcionará. Sem cobrança,
              votos, algoritmo oculto ou números inventados.
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
              <form className="quick-entry" onSubmit={startFromHero} noValidate aria-label="Simular lance no ranking">
                <div className="hero-console-grid">
                  <div className="field field-product">
                    <label className="sr-only" htmlFor={inputId}>Endereço do produto</label>
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
                      <button type="button" onClick={() => setBid((value) => Math.max(MIN_BID, value - 1))} aria-label="Diminuir lance" disabled={bid === MIN_BID}>
                        <ViraIcon name="minus" />
                      </button>
                      <output aria-live="polite">{formattedBid}</output>
                      <button type="button" onClick={() => setBid((value) => Math.min(MAX_BID, value + 1))} aria-label="Aumentar lance" disabled={bid === MAX_BID}>
                        <ViraIcon name="plus" />
                      </button>
                    </div>
                  </fieldset>

                  <button ref={heroSubmitRef} className="button button-primary hero-submit" type="submit">
                    Simular meu lance <ViraIcon name="arrow-right" />
                  </button>
                </div>

                <small id={inputHintId} className="field-hint">A simulação não cobra, publica ou reserva uma posição.</small>
                {urlError && <small id={inputErrorId} className="field-error" role="alert">{urlError}</small>}
              </form>
            </div>
          </div>
        </section>

        <section className="lance-status" aria-label="Resumo da temporada">
          <article><span>{leader ? "LÍDER ATUAL" : "FONTE DO RANKING"}</span><strong>{leader ? leader.productName : isReadyEmpty ? "Nenhuma entrada retornada." : ranking.state === "unconfigured" ? "Ainda não conectada." : "Temporariamente indisponível."}</strong><p>{leader ? `${formatBid(leader.amountCents)} confirmados no lance atual.` : isReadyEmpty ? "A resposta pública não informa se há uma temporada aberta." : ranking.state === "unconfigured" ? "Nenhuma vaga ou posição foi presumida." : "Não foi possível verificar as posições agora."}</p></article>
          <article><span>ATIVIDADE RECENTE</span><strong>{leader ? `${ranking.entries.length} ${ranking.entries.length === 1 ? "produto na disputa" : "produtos na disputa"}.` : isReadyEmpty ? "Nenhuma atividade retornada." : "Atividade não verificada."}</strong><p>{leader ? "A classificação reflete somente produtos verificados e lances confirmados." : isReadyEmpty ? "Uma confirmação só aparecerá durante uma temporada válida." : "Conecte ou restabeleça a fonte pública para consultar a temporada."}</p></article>
        </section>

        <section className="lance-board" aria-labelledby="board-title">
          <header className="board-heading">
            <div><span className="eyebrow">QUADRO</span><h2 id="board-title">Ranking sem preenchimento artificial.</h2></div>
            <Link href="/ranking">Abrir ranking completo <ViraIcon name="arrow-right" size={16} /></Link>
          </header>
          {leader ? (
            <div className="board-entry">
              <span className="empty-position tabular">#1</span>
              <span className="rank-monogram" aria-hidden="true">{leader.productName.slice(0, 1).toUpperCase()}</span>
              <div><strong>{leader.productName}</strong><p>{leader.description || leader.category}</p></div>
              <strong className="board-entry-bid tabular">{formatBid(leader.amountCents)}</strong>
              {leaderHref && <a className="button button-secondary" href={leaderHref} target="_blank" rel="noopener noreferrer">Visitar produto <ViraIcon name="arrow-right" /></a>}
            </div>
          ) : (
            <div className="board-empty">
              <span className="empty-position tabular">—</span>
              <div><strong>{isReadyEmpty ? "Nenhuma entrada confirmada foi retornada." : ranking.state === "unconfigured" ? "O quadro ainda não foi conectado." : "O quadro não pôde ser consultado."}</strong><p>{isReadyEmpty ? "A resposta não anuncia uma temporada aberta nem reserva o primeiro lugar." : ranking.state === "unconfigured" ? "Nenhuma vaga ou posição está sendo presumida durante o pré-lançamento." : "Tente novamente mais tarde; não exibimos um estado presumido."}</p></div>
              <button className="button button-secondary" type="button" onClick={focusHeroSimulator}>Simular no topo <ViraIcon name="arrow-right" /></button>
            </div>
          )}
        </section>

        <section className="lance-explainer" aria-labelledby="explainer-title">
          <div><span className="eyebrow">COMO FUNCIONA</span><h2 id="explainer-title">Posição comprada.<br />Critério publicado.</h2></div>
          <div>
            <p>ViraTopo é um ranking público de produtos digitais brasileiros. A posição é definida pelo valor de cada lance confirmado, com desempate pela confirmação mais antiga. Exibições e cliques só são publicados quando existem dados reais.</p>
            <p className="demo-note">O simulador não cobra, não cria uma entrada e não reserva posição.</p>
          </div>
        </section>
      </main>

      <ArenaFooter />

      <Dialog.Root open={flow !== null} onOpenChange={({ open }) => { if (!open) closeFlow(); }} lazyMount unmountOnExit>
        <Dialog.Backdrop className="flow-backdrop" />
        <Dialog.Positioner className="flow-positioner">
          <Dialog.Content className="flow-panel">
            {flow && waitlistStatus !== "success" && <span className="flow-progress tabular">ETAPA {flow === "summary" ? 1 : 2} DE 2</span>}

            {flow === "summary" && (
              <>
                <Dialog.Title>Revise sua simulação.</Dialog.Title>
                <Dialog.Description>Este resumo não gera cobrança, publicação ou reserva de posição.</Dialog.Description>
                <dl className="simulation-summary">
                  <div><dt>Produto</dt><dd>{url}</dd></div>
                  <div><dt>Lance simulado</dt><dd className="tabular">{formattedBid}</dd></div>
                </dl>
                <p className="simulation-note">A lista de lançamento serve apenas para avisar quando o ViraTopo estiver pronto para receber entradas reais.</p>
                <div className="flow-actions">
                  <button className="button button-secondary" type="button" onClick={editSimulation}>Ajustar simulação</button>
                  <button ref={summaryContinueRef} className="button button-primary" type="button" onClick={continueToWaitlist} autoFocus>Ir para a lista <ViraIcon name="arrow-right" /></button>
                </div>
              </>
            )}

            {flow === "waitlist" && waitlistStatus !== "success" && (
              <>
                <Dialog.Title>Entre na lista de lançamento.</Dialog.Title>
                <Dialog.Description>Enviaremos apenas avisos sobre o lançamento e esta simulação.</Dialog.Description>
                <form className="waitlist-form" onSubmit={submitWaitlist} noValidate aria-busy={waitlistStatus === "loading"}>
                  <div className="waitlist-field">
                    <label htmlFor="flow-email">Seu e-mail</label>
                    <input
                      ref={emailRef}
                      id="flow-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailError("");
                        setWaitlistStatus("idle");
                      }}
                      placeholder="voce@empresa.com"
                      autoFocus
                      autoComplete="email"
                      inputMode="email"
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? flowEmailErrorId : undefined}
                      disabled={waitlistStatus === "loading"}
                    />
                    {emailError && <small id={flowEmailErrorId} className="field-error" role="alert">{emailError}</small>}
                  </div>

                  <div className="consent-field">
                    <label className="consent-check" htmlFor="waitlist-consent">
                      <input
                        ref={consentRef}
                        id="waitlist-consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          setConsentError("");
                          setWaitlistStatus("idle");
                        }}
                        aria-invalid={Boolean(consentError)}
                        aria-describedby={consentError ? flowConsentErrorId : undefined}
                        disabled={waitlistStatus === "loading"}
                      />
                      <span>Quero receber e-mails sobre o lançamento e esta simulação. Posso cancelar a qualquer momento.</span>
                    </label>
                    {consentError && <small id={flowConsentErrorId} className="field-error" role="alert">{consentError}</small>}
                    <small className="consent-note">Uso dos dados conforme a <Link href="/privacidade">Política de Privacidade</Link>.</small>
                  </div>

                  <div className="waitlist-honeypot" aria-hidden="true">
                    <label htmlFor="waitlist-website">Não preencha este campo</label>
                    <input id="waitlist-website" name="website" type="text" value={website} onChange={(event) => setWebsite(event.target.value)} autoComplete="off" tabIndex={-1} />
                  </div>

                  {(waitlistStatus === "error" || waitlistStatus === "unavailable") && (
                    <div ref={waitlistFeedbackRef} id={waitlistFeedbackId} className="waitlist-feedback" data-kind={waitlistStatus} role="alert" tabIndex={-1}>
                      <strong>{waitlistStatus === "unavailable" ? "Lista temporariamente indisponível." : "Cadastro não confirmado."}</strong>
                      <p>{waitlistStatus === "unavailable" ? "Nada foi enviado. Tente novamente mais tarde." : "Nada foi salvo. Confira os dados e tente novamente."}</p>
                    </div>
                  )}

                  <div className="flow-actions">
                    <button className="button button-secondary" type="button" onClick={returnToSummary} disabled={waitlistStatus === "loading"}>Voltar</button>
                    <button className="button button-primary" type="submit" disabled={waitlistStatus === "loading"}>
                      {waitlistStatus === "loading" ? "Enviando…" : waitlistStatus === "error" || waitlistStatus === "unavailable" ? "Tentar novamente" : "Entrar na lista"}
                      {waitlistStatus !== "loading" && <ViraIcon name="arrow-right" />}
                    </button>
                  </div>
                </form>
              </>
            )}

            {flow === "waitlist" && waitlistStatus === "success" && (
              <div ref={waitlistFeedbackRef} id={waitlistFeedbackId} className="waitlist-success" role="status" tabIndex={-1}>
                <span className="success-mark" aria-hidden="true"><ViraIcon name="check" size={22} /></span>
                <Dialog.Title>Solicitação recebida.</Dialog.Title>
                <Dialog.Description>Recebemos sua solicitação; se elegível, você receberá avisos de lançamento no e-mail informado. Nenhuma cobrança ou posição foi criada.</Dialog.Description>
                <button className="button button-primary full" type="button" onClick={finishWaitlist}>Voltar ao quadro</button>
              </div>
            )}

            <Dialog.CloseTrigger className="icon-close" aria-label="Fechar"><ViraIcon name="x" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}
