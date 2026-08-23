import Link from "next/link";

type ArenaNavProps = { active?: "arena" | "rules" | "analytics" };

export function ArenaNav({ active }: ArenaNavProps) {
  return <header className="arena-nav"><Link className="arena-logo" href="/" aria-label="ViraTopo, início"><img src="/viratopo-mark.svg" width="28" height="28" alt="" /><b>ViraTopo</b></Link><nav aria-label="Navegação principal"><Link className={active === "arena" ? "active" : ""} href="/">Quadro</Link><Link className={active === "rules" ? "active" : ""} href="/termos">Regras</Link><Link className={active === "analytics" ? "active" : ""} href="/analytics">Estatísticas</Link></nav></header>;
}

export function ArenaFooter() {
  return <footer className="arena-footer"><span>© 2026 ViraTopo</span><span>Transparência por padrão</span><div><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></div></footer>;
}
