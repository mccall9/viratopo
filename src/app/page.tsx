"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, Copy, Minus, Plus, X } from "lucide-react";

type Panel = "entry" | "account" | "pix" | null;

export default function Home() {
  const [panel, setPanel] = useState<Panel>(null);
  const [url, setUrl] = useState("");
  const [bid, setBid] = useState(1);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) setPanel("account");
  }

  function copyPix() {
    navigator.clipboard?.writeText("0002012658VIRATOPODEMO");
    setCopied(true);
  }

  return <main id="inicio">
    <a className="skip-link" href="#edicao">Pular para a edição</a>
    <header className="topbar">
      <a className="wordmark" href="#inicio" aria-label="ViraTopo, início"><span>VT</span> ViraTopo</a>
      <nav aria-label="Navegação principal"><a href="#edicao">Edição</a><a href="#metodo">Método</a><a href="#relatorio">Relatório</a></nav>
      <button className="quiet-action" onClick={() => setPanel("account")}>Entrar <ArrowUpRight size={14} /></button>
    </header>

    <section className="edition-head shell" aria-labelledby="edition-title">
      <div className="edition-intro"><p className="eyebrow">VIRATOPO / EDIÇÃO 001</p><h1 id="edition-title">A vitrine<br />ainda está <em>em branco.</em></h1><p className="lede">Uma edição pública para produtos independentes. O primeiro PIX confirmado inaugura o placar — sem audiência, cliques ou marcas inventadas.</p><button className="primary-action" onClick={() => setPanel("entry")}>Inscrever produto <ArrowUpRight size={17} /></button></div>
      <div className="edition-stamp" aria-label="A edição está aberta"><div className="stamp-top"><span>EDIÇÃO ABERTA</span><span>001 / BR</span></div><div className="stamp-main"><i>VT</i><strong>PRIMEIRA<br />MANCHETE</strong></div><div className="stamp-foot"><span>R$ 1,00</span><span>lance inicial</span></div></div>
    </section>

    <section className="edition-map shell" id="edicao" aria-labelledby="map-title">
      <div className="section-heading"><p className="eyebrow">MAPA DA EDIÇÃO</p><h2 id="map-title">O placar começa<br />quando alguém entra.</h2></div>
      <div className="map-grid">
        <aside className="index-panel" aria-label="Índice da edição"><span className="panel-label">ÍNDICE</span><a className="active" href="#placar"><b>01</b> Placar <ArrowUpRight size={14} /></a><a href="#sinais"><b>02</b> Sinais <ArrowUpRight size={14} /></a><a href="#metodo"><b>03</b> Método <ArrowUpRight size={14} /></a></aside>
        <article className="duel-panel" id="placar"><div className="panel-meta"><span>PLACAR AO VIVO</span><span><b /> aguardando primeiro produto</span></div><div className="empty-duel"><span>01</span><div><h3>O espaço do líder<br />é seu.</h3><p>Seu produto será exibido aqui apenas depois da confirmação do pagamento. Transparência é parte da disputa.</p></div></div><button className="text-action" onClick={() => setPanel("entry")}>Ser a primeira entrada <ArrowUpRight size={16} /></button></article>
        <aside className="signals-panel" id="sinais"><span className="panel-label">SINAIS</span><div><small>AGORA</small><p>Edição recebendo inscrições.</p></div><div><small>DEPOIS</small><p>O ranking abre com o primeiro pagamento aprovado.</p></div><div><small>REGRA</small><p>Todo número publicado precisa ter origem verificável.</p></div></aside>
      </div>
    </section>

    <section className="timeline shell" aria-label="Linha do tempo da edição"><p className="eyebrow">LINHA DE EDIÇÃO</p><div><span>00:00</span><p>A edição 001 foi aberta para receber produtos.</p><span>próximo evento: primeira confirmação</span></div></section>
    <section className="method shell" id="metodo"><div><p className="eyebrow">PROTOCOLO DE ENTRADA</p><h2>Sem formulário<br />que parece <em>checkout.</em></h2></div><ol><li><b>01</b><div><h3>Declare seu produto</h3><p>Informe o endereço público que vai ocupar uma posição na edição.</p></div></li><li><b>02</b><div><h3>Defina o lance</h3><p>Você escolhe o valor e vê a proposta antes de pagar.</p></div></li><li><b>03</b><div><h3>Confirme no PIX</h3><p>Após a confirmação, a entrada vai ao placar com dados reais.</p></div></li></ol></section>
    <section className="report shell" id="relatorio" aria-labelledby="report-title"><div className="report-title"><p className="eyebrow">CADERNO DE VISIBILIDADE</p><h2 id="report-title">O relatório<br />também espera<br /><em>fatos.</em></h2></div><div className="report-zero"><p>SEM DADOS DECORATIVOS</p><strong>—</strong><span>Quando a edição começar, esta área publicará a origem de cada exibição e clique entregue.</span></div><a className="report-link" href="#edicao">Entender o placar <ArrowUpRight size={16} /></a></section>
    <footer className="site-footer shell"><a className="wordmark" href="#inicio"><span>VT</span> ViraTopo</a><p>Escolha pública, não algoritmo.</p><div><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a></div></footer>

    {panel && <div className="drawer-layer" role="presentation" onMouseDown={() => setPanel(null)}><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setPanel(null)} aria-label="Fechar"><X size={20} /></button>
      {panel === "entry" && <form onSubmit={startCheckout}><p className="eyebrow">NOVA ENTRADA / 001</p><h2 id="drawer-title">Coloque seu<br /><em>produto na pauta.</em></h2><label>ENDEREÇO DO PRODUTO<input autoFocus required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="seuproduto.com" inputMode="url" /></label><div className="bid-control"><span>LANCE DE ESTREIA</span><div><button type="button" aria-label="Diminuir lance" onClick={() => setBid((current) => Math.max(1, current - 1))}><Minus size={16} /></button><strong>R$ {bid},00</strong><button type="button" aria-label="Aumentar lance" onClick={() => setBid((current) => current + 1)}><Plus size={16} /></button></div></div><button className="primary-action" type="submit">Continuar <ArrowUpRight size={17} /></button></form>}
      {panel === "account" && <form onSubmit={(event) => { event.preventDefault(); setPanel("pix"); }}><p className="eyebrow">IDENTIFICAÇÃO</p><h2 id="drawer-title">Assine sua<br /><em>entrada.</em></h2><label>E-MAIL<input autoFocus type="email" required placeholder="voce@produto.com" /></label><label>SENHA<input type="password" required minLength={6} placeholder="No mínimo 6 caracteres" /></label><button className="primary-action" type="submit">Ver recibo <ArrowUpRight size={17} /></button></form>}
      {panel === "pix" && <div className="receipt"><p className="eyebrow">RECIBO / EDIÇÃO 001</p><h2 id="drawer-title">Lance<br /><em>pronto.</em></h2><div className="receipt-data"><i>VT</i><div><span>VALOR A CONFIRMAR</span><strong>R$ {bid},00</strong><small>ViraTopo Serviços Digitais</small></div></div><button className="copy-action" onClick={copyPix}><Copy size={15} /> {copied ? "Código PIX copiado" : "Copiar código PIX"}</button><button className="primary-action" onClick={() => { setPanel(null); setSent(true); }}>Já paguei <ArrowUpRight size={17} /></button></div>}
    </section></div>}
    {sent && <div className="toast" role="status">Aviso de pagamento registrado. <button onClick={() => setSent(false)}>Fechar</button></div>}
  </main>;
}
