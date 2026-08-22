import Link from "next/link";

export default function PrivacyPage() {
  return <main className="legal-page"><Link className="logo" href="/">vira<span>topo</span><i>.</i></Link><p className="eyebrow">PRIVACIDADE</p><h1>Dados para manter a disputa limpa.</h1><p>O ViraTopo guarda dados de conta, produtos, lances e métricas necessárias para exibir o ranking e prevenir abuso. Nunca vendemos dados pessoais.</p><p>Em uma versão com pagamentos reais, o provedor PIX processará dados financeiros de acordo com sua própria política. O MVP atual não processa pagamentos.</p><Link className="legal-back" href="/">← Voltar ao ranking</Link></main>;
}
