"use client";

import { FormEvent, useState } from "react";
import { Button } from "@mantine/core";
import { ArrowRight, Copy, Link2, Minus, Plus, X } from "lucide-react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";

type Flow = "entry" | "account" | "pix" | null;

export default function Home() {
  const [flow, setFlow] = useState<Flow>(null);
  const [url, setUrl] = useState("");
  const [bid, setBid] = useState(1);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const continueToAccount = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (url.trim()) setFlow("account"); };

  return <main className="arena-app lance-app">
    <a className="skip" href="#quadro">Pular para o quadro</a><ArenaNav active="arena" />
    <section className="lance-hero"><div className="season-line"><span>Temporada em preparação</span><b>ranking abre com o primeiro PIX confirmado</b><a href="/termos">ver regras <ArrowRight size={13} /></a></div><h1>Coloque seu produto<br />no topo por <span><button onClick={() => setBid((value) => Math.max(1, value - 1))} aria-label="Diminuir lance"><Minus size={17} /></button>R$ {bid}<button onClick={() => setBid((value) => value + 1)} aria-label="Aumentar lance"><Plus size={17} /></button></span></h1><p>O lance inicial define sua entrada. Se alguém ultrapassar, você decide se quer voltar à frente.</p><form className="quick-entry" onSubmit={continueToAccount}><label><Link2 size={17} /><span className="sr-only">Endereço do produto</span><input required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="site do seu produto ou @usuário" inputMode="url" /></label><Button className="lance-submit" type="submit" rightSection={<ArrowRight size={17} />}>Entrar no ranking</Button></form><small>Já está no quadro? Use o mesmo link e o sistema calculará apenas a diferença.</small></section>
    <section className="lance-status"><article><h2>Próxima entrada</h2><p>Nenhum produto confirmado ainda.</p><span>A primeira confirmação inaugura o #1.</span></article><article><h2>Atividade recente</h2><p>Nenhuma movimentação na temporada.</p><span>Entradas e trocas de posição aparecem aqui em tempo real.</span></article></section>
    <section className="lance-board" id="quadro"><div className="board-heading"><div><span>QUADRO DA TEMPORADA</span><h2>As posições estão abertas.</h2></div><a href="/ranking">Ver ranking completo <ArrowRight size={15} /></a></div><ol><li className="first-slot"><b>#1</b><div className="slot-icon">?</div><div><strong>O topo está disponível.</strong><p>Confirme a primeira entrada e assuma esta posição.</p></div><div className="slot-bid"><b>R$ {bid}</b><small>lance inicial</small></div><button onClick={() => setFlow("entry")}>Quero esta posição <ArrowRight size={15} /></button></li><li><b>#2</b><div className="slot-icon muted">—</div><div><strong>Próxima posição</strong><p>O quadro revela novos lugares quando a temporada começar.</p></div><div className="slot-bid"><b>—</b><small>sem lance</small></div></li></ol></section>
    <section className="lance-explainer"><div><span>SEM NÚMERO DECORATIVO</span><h2>Sem votos.<br />Sem algoritmo.</h2></div><p>O ranking é ordenado por lances confirmados. Métricas de exibição e clique só aparecem depois que houver dados reais para publicar.</p></section><ArenaFooter />
    {flow && <div className="flow-backdrop" onMouseDown={() => setFlow(null)}><section className="flow-panel" role="dialog" aria-modal="true" aria-labelledby="flow-title" onMouseDown={(event) => event.stopPropagation()}><button className="icon-close" onClick={() => setFlow(null)} aria-label="Fechar"><X size={19} /></button>
      {flow === "entry" && <form onSubmit={continueToAccount}><span className="card-label">NOVA ENTRADA</span><h2 id="flow-title">Entrar no<br /><em>quadro.</em></h2><label>URL DO PRODUTO<input value={url} onChange={(event) => setUrl(event.target.value)} required autoFocus inputMode="url" placeholder="seuproduto.com" /></label><div className="bid-row"><span>LANCE INICIAL</span><div><button type="button" onClick={() => setBid((value) => Math.max(1, value - 1))} aria-label="Diminuir lance"><Minus size={16} /></button><strong>R$ {bid},00</strong><button type="button" onClick={() => setBid((value) => value + 1)} aria-label="Aumentar lance"><Plus size={16} /></button></div></div><button className="button button-primary" type="submit">Continuar <ArrowRight size={17} /></button></form>}
      {flow === "account" && <form onSubmit={(event) => { event.preventDefault(); setFlow("pix"); }}><span className="card-label">IDENTIFICAÇÃO</span><h2 id="flow-title">Confirme sua<br /><em>entrada.</em></h2><label>E-MAIL<input type="email" required autoFocus placeholder="voce@produto.com" /></label><label>SENHA<input type="password" required minLength={6} autoComplete="current-password" placeholder="No mínimo 6 caracteres" /></label><button className="button button-primary" type="submit">Ver PIX <ArrowRight size={17} /></button></form>}
      {flow === "pix" && <div><span className="card-label">PAGAMENTO PIX</span><h2 id="flow-title">Seu lance<br /><em>está pronto.</em></h2><div className="pix-receipt"><span>VT</span><div><small>VALOR A CONFIRMAR</small><strong>R$ {bid},00</strong><p>ViraTopo Serviços Digitais</p></div></div><button className="button button-ghost full" onClick={() => { navigator.clipboard?.writeText("0002012658VIRATOPODEMO"); setCopied(true); }}><Copy size={16} /> {copied ? "Código copiado" : "Copiar código PIX"}</button><button className="button button-primary full" onClick={() => { setFlow(null); setNotice("Aviso de pagamento registrado. Sua entrada aparece após a confirmação."); }}>Já paguei <ArrowRight size={17} /></button></div>}
    </section></div>}{notice && <div className="arena-toast" role="status">{notice}<button onClick={() => setNotice("")}>Fechar</button></div>}
  </main>;
}
