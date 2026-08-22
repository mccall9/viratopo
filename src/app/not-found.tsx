import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}><section><p style={{ letterSpacing: "2px", fontSize: 13 }}>FORA DO RANKING</p><h1 style={{ fontSize: "clamp(48px, 10vw, 100px)", margin: "10px 0", letterSpacing: "-5px" }}>Essa página caiu.</h1><p>Ela não existe ou alguém deu um lance maior.</p><Link style={{ display: "inline-block", background: "#bcff16", padding: "12px 16px", borderRadius: 10, fontWeight: 800, marginTop: 15 }} href="/">VOLTAR AO TOPO →</Link></section></main>;
}
