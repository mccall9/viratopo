import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";

export default function NotFound() {
  return <main className="arena-app"><ArenaNav /><section className="not-found-shell"><span className="kicker">ERRO 404</span><strong>404</strong><h1>Esta posição<br /><em>não existe.</em></h1><p>A página pode ter mudado de endereço ou ainda não entrou na Arena.</p><Link className="button button-primary" href="/">Voltar para a Arena <ArrowRight size={17} /></Link></section><ArenaFooter /></main>;
}
