import Link from "next/link";

type ArenaNavProps = { active?: "arena" | "ranking" | "analytics" | "painel" };

export function ArenaNav({ active }: ArenaNavProps) {
  return <header className="arena-nav"><Link className="arena-logo" href="/" aria-label="ViraTopo, início"><span>V</span><b>ViraTopo</b></Link><nav aria-label="Navegação principal"><Link className={active === "arena" ? "active" : ""} href="/">Arena</Link><Link className={active === "ranking" ? "active" : ""} href="/ranking">Ranking</Link><Link className={active === "analytics" ? "active" : ""} href="/analytics">Dados</Link></nav><Link className="nav-profile" href="/painel"><i /> Meu painel</Link></header>;
}

export function ArenaFooter() {
  return <footer className="arena-footer"><span>© 2026 ViraTopo</span><span>Transparência por padrão</span><div><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></div></footer>;
}
