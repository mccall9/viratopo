"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type ArenaNavProps = { active?: "arena" | "rules" | "analytics"; variant?: "floating" | "inner" };

export function ArenaNav({ active, variant = "floating" }: ArenaNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`arena-nav ${variant === "inner" ? "inner-header" : ""} ${menuOpen ? "is-menu-open" : ""}`}>
      <Link className="arena-logo" href="/" aria-label="ViraTopo, início" onClick={closeMenu}>
        <img src="/viratopo-mark.svg" width="28" height="28" alt="" />
        <b>ViraTopo</b>
      </Link>
      <button className="nav-toggle" type="button" aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? <X size={18} /> : <Menu size={19} />}
      </button>
      <nav id="primary-navigation" aria-label="Navegação principal">
        <Link className={active === "arena" ? "active" : ""} href="/" onClick={closeMenu}>Quadro</Link>
        <Link className={active === "rules" ? "active" : ""} href="/termos" onClick={closeMenu}>Regras</Link>
        <Link className={active === "analytics" ? "active" : ""} href="/analytics" onClick={closeMenu}>Estatísticas</Link>
      </nav>
    </header>
  );
}

export function ArenaFooter() {
  return <footer className="arena-footer"><span>© 2026 ViraTopo</span><span>Transparência por padrão</span><div><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></div></footer>;
}
