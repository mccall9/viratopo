"use client";

import { FormEvent, KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import { ArrowRight, Check, Copy, Link2, Minus, Plus, X } from "lucide-react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";

type Flow = "entry" | "account" | "pix" | null;

const FLOW_STEPS: Record<Exclude<Flow, null>, number> = { entry: 1, account: 2, pix: 3 };

export default function Home() {
  const [flow, setFlow] = useState<Flow>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [bid, setBid] = useState(1);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [sheetOffset, setSheetOffset] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const sheetGesture = useRef({ pointerId: 0, startY: 0, lastY: 0, lastTime: 0, velocity: 0 });

  const closeFlow = () => {
    setSheetOffset(0);
    setFlow(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const openFlow = (nextFlow: Exclude<Flow, null>, event?: MouseEvent<HTMLElement>) => {
    triggerRef.current = event?.currentTarget ?? (document.activeElement as HTMLElement | null);
    setCopied(false);
    setSheetOffset(0);
    setFlow(nextFlow);
  };

  useEffect(() => {
    if (!flow) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFlow();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flow]);

  const trapDialogFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), a[href]"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const continueToAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) {
      setUrlError("Informe o endereço do produto para continuar.");
      return;
    }
    setUrlError("");
    setFlow("account");
  };
  const continueToPix = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setAccountError("Informe um e-mail válido.");
      return;
    }
    if (password.length < 6) {
      setAccountError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setAccountError("");
    setFlow("pix");
  };
  const updateUrl = (value: string) => {
    setUrl(value);
    setUrlError("");
  };

  const beginSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const now = performance.now();
    sheetGesture.current = { pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: now, velocity: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (sheetGesture.current.pointerId !== event.pointerId) return;
    const now = performance.now();
    const distance = Math.max(0, event.clientY - sheetGesture.current.startY);
    const elapsed = Math.max(1, now - sheetGesture.current.lastTime);
    sheetGesture.current.velocity = (event.clientY - sheetGesture.current.lastY) / elapsed;
    sheetGesture.current.lastY = event.clientY;
    sheetGesture.current.lastTime = now;
    setSheetOffset(distance);
  };
  const endSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (sheetGesture.current.pointerId !== event.pointerId) return;
    const shouldDismiss = sheetOffset > 120 || sheetGesture.current.velocity > 0.75;
    sheetGesture.current.pointerId = 0;
    if (shouldDismiss) closeFlow();
    else setSheetOffset(0);
  };

  const flowTitle = flow === "entry" ? "Entrar no quadro" : flow === "account" ? "Confirme sua entrada" : "Seu lance está pronto";

  return (
    <main className="arena-app lance-app">
      <a className="skip" href="#quadro">Pular para o quadro</a>
      <ArenaNav active="arena" />

      <section className="lance-hero">
        <div className="season-line"><span>Temporada em preparação</span><b>ranking abre com o primeiro PIX confirmado</b><a href="/termos">ver regras <ArrowRight size={13} /></a></div>
        <h1>Coloque seu produto<br />no topo.</h1>
        <div className="hero-bid" aria-label={`Lance inicial de R$ ${bid}`}>
          <span>Lance inicial</span>
          <div><button onClick={() => setBid((value) => Math.max(1, value - 1))} aria-label="Diminuir lance"><Minus size={17} /></button><strong>R$ {bid}</strong><button onClick={() => setBid((value) => value + 1)} aria-label="Aumentar lance"><Plus size={17} /></button></div>
        </div>
        <p>O lance inicial define sua entrada. Se alguém ultrapassar, você decide se quer voltar à frente.</p>
        <form className="quick-entry" onSubmit={continueToAccount} noValidate>
          <label><Link2 size={17} /><span className="sr-only">Endereço do produto</span><input value={url} onChange={(event) => updateUrl(event.target.value)} aria-invalid={Boolean(urlError)} aria-describedby={urlError ? "url-error" : undefined} placeholder="site do seu produto ou @usuário" inputMode="url" /></label>
          <Button className="lance-submit" type="submit" rightSection={<ArrowRight size={17} />}>Entrar no ranking</Button>
        </form>
        {urlError && <p className="field-error" id="url-error" role="alert">{urlError}</p>}
        <small>Já está no quadro? Use o mesmo link e o sistema calculará apenas a diferença.</small>
      </section>

      <section className="lance-status">
        <article><h2>Próxima entrada</h2><p>Nenhum produto confirmado ainda.</p><span>A primeira confirmação inaugura o #1.</span></article>
        <article><h2>Atividade recente</h2><p>Nenhuma movimentação na temporada.</p><span>Entradas e trocas de posição aparecem aqui em tempo real.</span></article>
      </section>

      <section className="lance-board" id="quadro">
        <div className="board-heading"><div><span>QUADRO DA TEMPORADA</span><h2>As posições estão abertas.</h2></div><a href="/ranking">Ver ranking completo <ArrowRight size={15} /></a></div>
        <ol>
          <li className="first-slot"><b>#1</b><div className="slot-icon">?</div><div><strong>O topo está disponível.</strong><p>Confirme a primeira entrada e assuma esta posição.</p></div><div className="slot-bid"><b>R$ {bid}</b><small>lance inicial</small></div><button onClick={(event) => openFlow("entry", event)}>Quero esta posição <ArrowRight size={15} /></button></li>
          <li><b>#2</b><div className="slot-icon muted">—</div><div><strong>Próxima posição</strong><p>O quadro revela novos lugares quando a temporada começar.</p></div><div className="slot-bid"><b>—</b><small>sem lance</small></div></li>
        </ol>
      </section>

      <section className="lance-explainer"><div><span>SEM NÚMERO DECORATIVO</span><h2>Sem votos.<br />Sem algoritmo.</h2></div><p>O ranking é ordenado por lances confirmados. Métricas de exibição e clique só aparecem depois que houver dados reais para publicar.</p></section>
      <ArenaFooter />

      {flow && (
        <div className="flow-backdrop" onMouseDown={closeFlow}>
          <section ref={dialogRef} className="flow-panel" role="dialog" aria-modal="true" aria-labelledby="flow-title" aria-describedby="flow-progress" onKeyDown={trapDialogFocus} onMouseDown={(event) => event.stopPropagation()} style={sheetOffset ? { transform: `translateY(${sheetOffset}px)` } : undefined}>
            <button className="sheet-grabber" type="button" tabIndex={-1} aria-label="Arraste para baixo para fechar" onPointerDown={beginSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={endSheetDrag} onPointerCancel={endSheetDrag}><span /></button>
            <button className="icon-close" onClick={closeFlow} aria-label="Fechar"><X size={19} /></button>
            <p className="flow-progress" id="flow-progress">Etapa {FLOW_STEPS[flow]} de 3 <span aria-hidden="true">·</span> {flowTitle}</p>

            {flow === "entry" && <form onSubmit={continueToAccount} noValidate><span className="card-label">NOVA ENTRADA</span><h2 id="flow-title">Entrar no<br /><em>quadro.</em></h2><label>URL DO PRODUTO<input value={url} onChange={(event) => updateUrl(event.target.value)} aria-invalid={Boolean(urlError)} aria-describedby={urlError ? "dialog-url-error" : undefined} autoFocus inputMode="url" placeholder="seuproduto.com" /></label>{urlError && <p className="field-error" id="dialog-url-error" role="alert">{urlError}</p>}<div className="bid-row"><span>LANCE INICIAL</span><div><button type="button" onClick={() => setBid((value) => Math.max(1, value - 1))} aria-label="Diminuir lance"><Minus size={16} /></button><strong>R$ {bid},00</strong><button type="button" onClick={() => setBid((value) => value + 1)} aria-label="Aumentar lance"><Plus size={16} /></button></div></div><button className="button button-primary" type="submit">Continuar <ArrowRight size={17} /></button></form>}
            {flow === "account" && <form onSubmit={continueToPix} noValidate><span className="card-label">IDENTIFICAÇÃO</span><h2 id="flow-title">Confirme sua<br /><em>entrada.</em></h2><label>E-MAIL<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setAccountError(""); }} aria-invalid={Boolean(accountError)} aria-describedby={accountError ? "account-error" : undefined} autoFocus placeholder="voce@produto.com" /></label><label>SENHA<input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setAccountError(""); }} aria-invalid={Boolean(accountError)} aria-describedby={accountError ? "account-error" : undefined} autoComplete="current-password" placeholder="No mínimo 6 caracteres" /></label>{accountError && <p className="field-error" id="account-error" role="alert">{accountError}</p>}<button className="button button-primary" type="submit">Ver PIX <ArrowRight size={17} /></button></form>}
            {flow === "pix" && <div><span className="card-label">PAGAMENTO PIX</span><h2 id="flow-title">Seu lance<br /><em>está pronto.</em></h2><div className="pix-receipt"><span>VT</span><div><small>VALOR A CONFIRMAR</small><strong>R$ {bid},00</strong><p>ViraTopo Serviços Digitais</p></div></div><button className={`button button-ghost full ${copied ? "is-confirmed" : ""}`} onClick={() => { navigator.clipboard?.writeText("0002012658VIRATOPODEMO"); setCopied(true); }}><span className="button-copy"><Copy size={16} /> Copiar código PIX</span><span className="button-confirm"><Check size={16} /> Código copiado</span></button><span className="sr-only" aria-live="polite">{copied ? "Código PIX copiado." : ""}</span><button className="button button-primary full" onClick={() => { closeFlow(); setNotice("Aviso de pagamento registrado. Sua entrada aparece após a confirmação."); }}>Já paguei <ArrowRight size={17} /></button></div>}
          </section>
        </div>
      )}
      {notice && <div className="arena-toast" role="status">{notice}<button onClick={() => setNotice("")}>Fechar</button></div>}
    </main>
  );
}
