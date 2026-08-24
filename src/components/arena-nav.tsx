"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ViraIcon } from "@/components/vira-icon";

type ArenaNavProps = { active?: "board" | "rules" | "analytics" | "ranking" };

export function ArenaNav({ active }: ArenaNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="arena-nav">
      <Link className="arena-logo" href="/" aria-label="ViraTopo, início" onClick={closeMenu}>
        <img src="/viratopo-mark.svg" width="28" height="28" alt="" />
        <b>ViraTopo</b>
      </Link>
      <button ref={buttonRef} className="nav-toggle" type="button" aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
        <ViraIcon name={menuOpen ? "x" : "menu"} />
      </button>
      <nav ref={menuRef} id="primary-navigation" aria-label="Navegação principal" data-open={menuOpen ? "true" : "false"}>
        <Link className={active === "board" ? "active" : ""} aria-current={active === "board" ? "page" : undefined} href="/" onClick={closeMenu}>Quadro</Link>
        <Link className={active === "ranking" ? "active" : ""} aria-current={active === "ranking" ? "page" : undefined} href="/ranking" onClick={closeMenu}>Ranking</Link>
        <Link className={active === "rules" ? "active" : ""} aria-current={active === "rules" ? "page" : undefined} href="/termos" onClick={closeMenu}>Regras</Link>
        <Link className={active === "analytics" ? "active" : ""} aria-current={active === "analytics" ? "page" : undefined} href="/analytics" onClick={closeMenu}>Estatísticas</Link>
      </nav>
    </header>
  );
}

export function ArenaFooter() {
  return (
    <footer className="arena-footer">
      <span>© 2026 ViraTopo</span>
      <span>Transparência por padrão</span>
      <div><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></div>
    </footer>
  );
}
