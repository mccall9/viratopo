"use client";

import { useState } from "react";
import { ViraIcon } from "@/components/vira-icon";

type RankingState = "ready" | "unconfigured" | "unavailable";

export function ShareRanking({ entriesCount, state }: { entriesCount: number; state: RankingState }) {
  const [status, setStatus] = useState("");
  const shareText = state === "ready" && entriesCount > 0
    ? `O ranking do ViraTopo está ao vivo com ${entriesCount} ${entriesCount === 1 ? "produto" : "produtos"} na disputa.`
    : state === "ready"
      ? "A fonte pública do ViraTopo não retornou entradas confirmadas. Isso não presume uma temporada aberta."
      : state === "unconfigured"
        ? "O ViraTopo está em pré-lançamento e sua fonte pública ainda não foi conectada."
        : "O ranking do ViraTopo não pôde ser consultado agora. Nenhuma posição foi presumida.";

  async function share() {
    const payload = { title: "ViraTopo", text: shareText, url: window.location.href };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setStatus("Compartilhado.");
        return;
      }

      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      setStatus("Link copiado.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Não foi possível compartilhar agora.");
    }
  }

  return (
    <div className="share-ranking">
      <button className="button button-secondary" type="button" onClick={share}>
        <ViraIcon name="copy" size={16} /> Compartilhar disputa
      </button>
      <span className="sr-only" role="status" aria-live="polite">{status}</span>
    </div>
  );
}
