import Link from "next/link";
import { ArenaFooter, ArenaNav } from "@/components/arena-nav";
import { ViraIcon } from "@/components/vira-icon";

export default function NotFound() {
  return <div className="arena-app"><a className="skip" href="#nao-encontrado">Pular para o conteúdo</a><ArenaNav /><main id="nao-encontrado" className="not-found-shell"><span className="eyebrow">ERRO 404</span><strong className="tabular">404</strong><h1>Esta posição não existe.</h1><p>A página pode ter mudado ou ainda não entrou no quadro.</p><Link className="button button-primary" href="/">Voltar ao quadro <ViraIcon name="arrow-right" /></Link></main><ArenaFooter /></div>;
}
