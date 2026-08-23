"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, ChevronRight, Copy, Minus, Plus, X } from "lucide-react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";

type Flow = "entry" | "account" | "pix" | null;

export default function Home() {
  const [flow, setFlow] = useState<Flow>(null);
  const [url, setUrl] = useState("");
  const [bid, setBid] = useState(1);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const submitEntry = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (url.trim()) setFlow("account"); };

  return <main className="arena-app">
    <a className="skip" href="#arena">Pular para a arena</a>
    <ArenaNav active="arena" />
    <section className="arena-hero" id="arena">
      <div className="hero-copy"><span className="kicker"><i /> TEMPORADA EM PRÉ-LANÇAMENTO</span><h1>Faça seu produto<br /><em>merecer a tela.</em></h1><p>ViraTopo é uma arena pública para produtos independentes. A classificação só começa quando houver um pagamento confirmado.</p><div className="hero-actions"><button className="button button-primary" onClick={() => setFlow("entry")}>Entrar na arena <ArrowRight size={17} /></button><a className="button button-ghost" href="/ranking">Ver ranking <ChevronRight size={17} /></a></div></div>
      <aside className="radar" aria-label="Radar da disputa"><div className="radar-top"><span>RADAR DE DISPUTA</span><b>LIVE</b></div><div className="radar-core"><div className="radar-ring ring-one" /><div className="radar-ring ring-two" /><div className="radar-ring ring-three" /><strong>?</strong><span>aguardando<br />primeiro sinal</span></div><div className="radar-bottom"><span>0 entradas confirmadas</span><span>R$ 0 em disputa</span></div></aside>
    </section>
    <section className="command-grid" aria-label="Central de controle da arena">
      <article className="command-card main-command"><div><span className="card-label">PRÓXIMA JOGADA</span><h2>Coloque seu produto no radar.</h2><p>Defina o primeiro lance. Você receberá o comprovante antes de qualquer cobrança.</p></div><button className="button button-light" onClick={() => setFlow("entry")}>Criar entrada <ArrowRight size={17} /></button></article>
      <article className="command-card pulse-card"><span className="card-label">PULSO DA ARENA</span><div className="pulse-value">00<span>/</span>00</div><p>Nenhuma posição ativa por enquanto.</p><div className="spark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></article>
      <article className="command-card rules-card"><span className="card-label">REGRAS RÁPIDAS</span><ul><li><Check size={15} /> O lance começa em R$ 1</li><li><Check size={15} /> PIX confirmado libera a posição</li><li><Check size={15} /> Métricas publicadas têm origem</li></ul><a href="/termos">Ler condições <ChevronRight size={15} /></a></article>
    </section>
    <section className="arena-feed"><div className="feed-title"><span className="card-label">MOVIMENTAÇÃO</span><h2>Quando a arena começar,<br />tudo aparece aqui.</h2></div><div className="feed-empty"><span className="empty-orbit" /><div><b>Sistema pronto para registrar eventos.</b><p>Entradas, mudanças de posição e leituras serão listadas em ordem real de confirmação.</p></div><a href="/analytics">Abrir dados <ArrowRight size={16} /></a></div></section>
    <ArenaFooter />
    {flow && <div className="flow-backdrop" onMouseDown={() => setFlow(null)}><section className="flow-panel" role="dialog" aria-modal="true" aria-labelledby="flow-title" onMouseDown={(event) => event.stopPropagation()}><button className="icon-close" onClick={() => setFlow(null)} aria-label="Fechar"><X size={19} /></button>
      {flow === "entry" && <form onSubmit={submitEntry}><span className="card-label">NOVA ENTRADA</span><h2 id="flow-title">Entrar no<br /><em>radar.</em></h2><label>URL DO PRODUTO<input value={url} onChange={(event) => setUrl(event.target.value)} required autoFocus inputMode="url" placeholder="seuproduto.com" /></label><div className="bid-row"><span>LANCE INICIAL</span><div><button type="button" onClick={() => setBid((value) => Math.max(1, value - 1))} aria-label="Diminuir lance"><Minus size={16} /></button><strong>R$ {bid},00</strong><button type="button" onClick={() => setBid((value) => value + 1)} aria-label="Aumentar lance"><Plus size={16} /></button></div></div><button className="button button-primary" type="submit">Continuar <ArrowRight size={17} /></button></form>}
      {flow === "account" && <form onSubmit={(event) => { event.preventDefault(); setFlow("pix"); }}><span className="card-label">IDENTIFICAÇÃO</span><h2 id="flow-title">Confirme sua<br /><em>entrada.</em></h2><label>E-MAIL<input type="email" required autoFocus placeholder="voce@produto.com" /></label><label>SENHA<input type="password" required minLength={6} autoComplete="current-password" placeholder="No mínimo 6 caracteres" /></label><button className="button button-primary" type="submit">Ver PIX <ArrowRight size={17} /></button></form>}
      {flow === "pix" && <div><span className="card-label">PAGAMENTO PIX</span><h2 id="flow-title">Seu lance<br /><em>está pronto.</em></h2><div className="pix-receipt"><span>VT</span><div><small>VALOR A CONFIRMAR</small><strong>R$ {bid},00</strong><p>ViraTopo Serviços Digitais</p></div></div><button className="button button-ghost full" onClick={() => { navigator.clipboard?.writeText("0002012658VIRATOPODEMO"); setCopied(true); }}><Copy size={16} /> {copied ? "Código copiado" : "Copiar código PIX"}</button><button className="button button-primary full" onClick={() => { setFlow(null); setNotice("Aviso de pagamento registrado. Sua entrada aparece após a confirmação."); }}>Já paguei <ArrowRight size={17} /></button></div>}
    </section></div>}
    {notice && <div className="arena-toast" role="status">{notice}<button onClick={() => setNotice("")}>Fechar</button></div>}
  </main>;
}
