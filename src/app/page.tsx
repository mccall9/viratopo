"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  url: string;
  description: string;
  category: "SaaS" | "Ferramentas" | "Criadores" | "Educação";
  bid: number;
  clicks: number;
  views: number;
  color: string;
  mark: string;
  momentum: number;
  risk: number;
  reaction?: string;
};

const products: Product[] = [
  { id: 1, name: "Fagulha", url: "fagulha.so", description: "Ideias curtas que viram conteúdo em minutos.", category: "Criadores", bid: 38, clicks: 46, views: 524, color: "#111111", mark: "F", momentum: 12, risk: 2, reaction: "dono do palco" },
  { id: 2, name: "Lumi", url: "usolumi.com", description: "Organize clientes sem perder o ritmo.", category: "SaaS", bid: 32, clicks: 39, views: 466, color: "#6b52ff", mark: "L", momentum: 7, risk: 4, reaction: "na cola" },
  { id: 3, name: "Giro", url: "giro.app", description: "Seu financeiro, finalmente sem planilha.", category: "Ferramentas", bid: 27, clicks: 31, views: 398, color: "#ed6a4d", mark: "G", momentum: 5, risk: 6 },
  { id: 4, name: "Mimo", url: "mimo.studio", description: "Presentes digitais que chegam com história.", category: "Criadores", bid: 21, clicks: 28, views: 365, color: "#ef2b92", mark: "M", momentum: 4, risk: 7 },
  { id: 5, name: "Nimbo", url: "nimbo.edu", description: "Estude com uma trilha que acompanha você.", category: "Educação", bid: 18, clicks: 24, views: 322, color: "#387fe8", mark: "N", momentum: 9, risk: 5, reaction: "queridinho" },
  { id: 6, name: "Bossa", url: "bossa.dev", description: "Deploy, domínio e e-mails num só lugar.", category: "Ferramentas", bid: 14, clicks: 19, views: 281, color: "#0b8376", mark: "B", momentum: 3, risk: 8 },
  { id: 7, name: "Visto", url: "visto.chat", description: "Atenda melhor no WhatsApp da sua empresa.", category: "SaaS", bid: 11, clicks: 12, views: 238, color: "#7648d8", mark: "V", momentum: 2, risk: 9 },
  { id: 8, name: "Caderno", url: "caderno.club", description: "Uma comunidade de leitura feita para marcar.", category: "Educação", bid: 8, clicks: 8, views: 196, color: "#c47e11", mark: "C", momentum: 6, risk: 10 },
];

const categories = ["Todos", "SaaS", "Ferramentas", "Criadores", "Educação"] as const;

function Brand({ product, size = "regular" }: { product: Product; size?: "regular" | "large" }) {
  return <span className={`brand-mark ${size}`} style={{ background: product.color }} aria-hidden="true">{product.mark}</span>;
}

function Currency({ value }: { value: number }) {
  return <span>R$ {value.toLocaleString("pt-BR")}</span>;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("Todos");
  const [bid, setBid] = useState(39);
  const [productUrl, setProductUrl] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [paid, setPaid] = useState(false);
  const [time, setTime] = useState({ h: 3, m: 27, s: 41 });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current.s > 0) return { ...current, s: current.s - 1 };
        if (current.m > 0) return { ...current, m: current.m - 1, s: 59 };
        if (current.h > 0) return { h: current.h - 1, m: 59, s: 59 };
        return current;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const displayedProducts = useMemo(
    () => selectedCategory === "Todos" ? products : products.filter((product) => product.category === selectedCategory),
    [selectedCategory],
  );
  const totalBid = products.reduce((sum, product) => sum + product.bid, 0);
  const totalViews = products.reduce((sum, product) => sum + product.views, 0);
  const totalClicks = products.reduce((sum, product) => sum + product.clicks, 0);

  function beginCheckout(event: FormEvent) {
    event.preventDefault();
    if (!productUrl.trim()) return;
    if (!authenticated) setAuthOpen(true);
    else setCheckoutOpen(true);
  }

  function signIn(event: FormEvent) {
    event.preventDefault();
    setAuthenticated(true);
    setAuthOpen(false);
    setCheckoutOpen(true);
  }

  function confirmPayment() {
    setPaid(true);
    setCheckoutOpen(false);
  }

  const cycleText = `${String(time.h).padStart(2, "0")}:${String(time.m).padStart(2, "0")}:${String(time.s).padStart(2, "0")}`;

  return (
    <main>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header">
        <a className="logo" href="#topo" aria-label="ViraTopo, página inicial">vira<span>topo</span><i>.</i></a>
        <nav aria-label="Navegação principal">
          <span className="live"><b></b> AO VIVO <em>• 8 produtos</em></span>
          <a href="#ranking">ranking</a>
          <a href="#numeros">analytics</a>
          <a href="#regras">como funciona</a>
          <button className="account" onClick={() => setAuthOpen(true)}>{authenticated ? "minha conta" : "entrar"}</button>
        </nav>
      </header>

      <section id="topo" className="hero" aria-labelledby="hero-title">
        <div className="pills"><span>PIX em segundos</span><span>posição atualizada na hora</span><span>lance a partir de R$ 1</span></div>
        <p className="eyebrow">O RANKING MAIS HONESTO DA INTERNET BR</p>
        <h1 id="hero-title">Seu produto no topo.<br /><mark>Até alguém cobrir.</mark></h1>
        <p className="hero-copy">Compre visibilidade, provoque a concorrência e transforme cada posição numa história para compartilhar.</p>
        <form className="entry-form" onSubmit={beginCheckout}>
          <label>
            <span>Seu produto ou URL</span>
            <input value={productUrl} onChange={(event) => setProductUrl(event.target.value)} required placeholder="meuproduto.com.br ou @perfil" aria-label="URL ou nome do seu produto" />
          </label>
          <div className="bid-picker" aria-label="Valor do lance">
            <button type="button" onClick={() => setBid(Math.max(1, bid - 1))} aria-label="Diminuir lance">−</button>
            <strong>R$ <output>{bid}</output></strong>
            <button type="button" onClick={() => setBid(bid + 1)} aria-label="Aumentar lance">+</button>
          </div>
          <button className="primary-button" type="submit">ENTRAR EM #1 <span>→</span></button>
        </form>
        <p className={`form-note ${paid ? "paid" : ""}`}>{paid ? "PIX aprovado. Seu produto já entrou na disputa." : "PIX confirmou, você aparece. Sem assinatura. Sem pegadinha."}</p>
        <article className="leader-card" aria-label="Atual líder do ranking">
          <div className="crown">♛</div>
          <Brand product={products[0]} size="large" />
          <div className="leader-info"><p>#1 AGORA <span>• reinando há 7h</span></p><h2>Fagulha</h2><a href="#ranking">VISITAR PRODUTO ↗</a></div>
          <div className="leader-bid"><strong><Currency value={38} /></strong><button onClick={() => { setProductUrl("meuproduto.com"); setBid(39); authenticated ? setCheckoutOpen(true) : setAuthOpen(true); }}>COBRIR POR R$ 39</button></div>
        </article>
      </section>

      <section id="ranking" className="ranking-section content-width" aria-labelledby="ranking-title">
        <div className="section-heading"><div><p className="eyebrow">DINHEIRO COMPRA POSIÇÃO. PRODUTO BOM COMPRA TORCIDA.</p><h2 id="ranking-title">A disputa agora</h2></div><div className="filters" role="group" aria-label="Filtrar ranking">{categories.map((category) => <button className={selectedCategory === category ? "active" : ""} onClick={() => setSelectedCategory(category)} key={category}>{category}</button>)}</div></div>
        <div className="ranking-list">
          {displayedProducts.map((product, index) => <article className={`rank-card ${product.id === 1 ? "first" : ""}`} key={product.id}>
            <div className="position">#{String(index + 1).padStart(2, "0")}</div>
            <Brand product={product} />
            <div className="product-info"><div><h3>{product.name}</h3><span className="category">{product.category}</span></div><a href={`https://${product.url}`} target="_blank" rel="noreferrer">{product.url} ↗</a><p>{product.description}</p>{product.reaction && <span className="reaction">◆ {product.reaction}</span>}</div>
            <div className="rank-metrics"><div><b>{product.clicks}</b><span>cliques</span></div><div><b>{product.views}</b><span>viram</span></div><small>↗ TORÇO {product.momentum}</small><small className="risk">♨ VAI CAIR {product.risk}</small></div>
            <div className="rank-bid"><strong><Currency value={product.bid} /></strong><span>{index === 0 ? "liderando" : `R$ ${products[0].bid - product.bid} do topo`}</span><button onClick={() => { setProductUrl(product.url); setBid(product.bid + 1); authenticated ? setCheckoutOpen(true) : setAuthOpen(true); }}>{index === 0 ? "DESBANCAR" : "PASSAR"}</button></div>
          </article>)}
        </div>
      </section>

      <section className="narrator content-width" aria-label="Narrador da disputa"><p className="eyebrow">NARRADOR DA TRETA</p><div><article><span>AGORA</span><p><b>Fagulha</b> segura o topo por R$ 38.</p></article><article><span>NA COLA</span><p><b>Lumi</b> precisa de R$ 7 para dar o golpe.</p></article><article><span>TORCIDA</span><p><b>Nimbo</b> ganhou o coração da galera.</p></article></div></section>

      <section id="regras" className="how content-width" aria-labelledby="how-title"><div><p className="eyebrow">SEM MANUAL DE 48 PÁGINAS</p><h2 id="how-title">Três passos.<br />Um Pix. Pronto.</h2></div><div className="steps"><article><span>1</span><p><b>Cole seu produto</b> e escolha quanto quer investir.</p></article><article><span>2</span><p><b>Pague no Pix</b> com uma confirmação em segundos.</p></article><article><span>3</span><p><b>Suba na hora</b> e compartilhe a provocação.</p></article><small>O maior lance fica na frente até o fim do ciclo. Em caso de empate, vale quem confirmou primeiro.</small></div></section>

      <section id="numeros" className="analytics content-width" aria-labelledby="analytics-title"><div className="analytics-intro"><div><p className="eyebrow">TRANSPARÊNCIA TAMBÉM DESBANCA</p><h2 id="analytics-title">Números<br /><mark>ao vivo.</mark></h2></div><p>Números públicos do ranking, atualizados a cada 15 segundos. Sem contador decorativo e sem vaidade inventada.</p></div><div className="stats-grid"><article><span>PRODUTOS NO CICLO</span><b>8</b></article><article><span>TOTAL NO RANKING</span><b><Currency value={totalBid} /></b></article><article><span>EXIBIÇÕES ENTREGUES</span><b>{totalViews.toLocaleString("pt-BR")}</b></article><article><span>CLIQUES ENTREGUES</span><b>{totalClicks}</b></article><article><span>REAÇÕES DA GALERA</span><b>82</b></article><article><span>PIX APROVADOS · 24H</span><b>8</b></article></div><div className="analytics-detail"><article><p className="eyebrow">INVESTIMENTO POR CATEGORIA</p>{["Criadores", "SaaS", "Ferramentas", "Educação"].map((category) => { const group = products.filter((p) => p.category === category); const value = group.reduce((sum, p) => sum + p.bid, 0); return <div className="category-bar" key={category}><div><b>{category}</b><span>{group.length} produtos · R$ {value}</span></div><i><em style={{ width: `${(value / 86) * 100}%` }} /></i></div>; })}</article><article><p className="eyebrow">QUEM MAIS ENTREGA VISIBILIDADE</p>{products.slice(0, 5).map((product, index) => <div className="visibility" key={product.id}><b>#{index + 1}</b><span><strong>{product.name}</strong><small>{product.url}</small></span><em>{product.clicks} cliques</em></div>)}</article></div><p className="updated"><b></b> ÚLTIMA ATUALIZAÇÃO: {cycleText} <span>Exibição é uma visita única por dia. Clique só conta quando alguém abre um link pelo ranking.</span></p></section>

      <footer className="content-width"><a className="logo" href="#topo">vira<span>topo</span><i>.</i></a><p>Não foi algoritmo. Foi Pix.</p><div><a href="#regras">Regras</a><a href="/privacidade">Privacidade</a><a href="/termos">Termos</a><a href="mailto:oi@viratopo.com">Falar com a gente</a></div></footer>

      {authOpen && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button className="close" onClick={() => setAuthOpen(false)} aria-label="Fechar">×</button><p className="eyebrow">ENTRE PARA DISPUTAR</p><h2 id="login-title">Seu produto<br />merece plateia.</h2><form onSubmit={signIn}><label>E-mail<input required type="email" placeholder="voce@empresa.com" /></label><label>Senha<input required minLength={6} type="password" placeholder="No mínimo 6 caracteres" /></label><button className="primary-button" type="submit">CRIAR CONTA E CONTINUAR <span>→</span></button></form><p className="modal-note">Ao continuar, você entra na fila para publicar e disputar posições.</p></section></div>}
      {checkoutOpen && <div className="modal-backdrop" role="presentation"><section className="modal checkout" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="close" onClick={() => setCheckoutOpen(false)} aria-label="Fechar">×</button><p className="eyebrow">PIX DEMONSTRATIVO</p><h2 id="checkout-title">Você está a R$ {Math.max(1, bid - 38)} do topo.</h2><div className="pix-content"><div className="qr" aria-label="QR Code PIX demonstrativo">{Array.from({ length: 49 }).map((_, i) => <i key={i} className={(i * 7 + i % 5) % 3 === 0 ? "on" : ""} />)}</div><div><p>Valor do lance</p><strong><Currency value={bid} /></strong><small>ViraTopo Serviços Digitais</small></div></div><button className="copy-code" onClick={() => navigator.clipboard?.writeText("00020126580014BR.GOV.BCB.PIX0114viratopo.demo520400005303986540539.005802BR5920ViraTopo Demo6009Sao Paulo")}>COPIAR CÓDIGO PIX</button><button className="primary-button full" onClick={confirmPayment}>JÁ PAGUEI, CONFIRMAR <span>→</span></button><p className="modal-note">Ambiente demonstrativo. Nenhum pagamento é processado.</p></section></div>}
    </main>
  );
}
