import Link from "next/link";

export default function TermsPage() {
  return <main className="legal-page"><Link className="logo" href="/">vira<span>topo</span><i>.</i></Link><p className="eyebrow">TERMOS DE USO</p><h1>Visibilidade não é promessa de venda.</h1><p>O ranking ordena produtos por lances confirmados dentro de um ciclo. Uma posição compra exibição, mas não garante cliques, receita ou conversão.</p><p>Produtos ilegais, enganosos ou que violem direitos de terceiros podem ser removidos. Em empate, vence o lance confirmado primeiro.</p><Link className="legal-back" href="/">← Voltar ao ranking</Link></main>;
}
