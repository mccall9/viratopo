import type { Metadata } from "next";
import { HomeArena } from "@/components/home-arena";

export const metadata: Metadata = {
  title: "Ranking público de produtos",
  description: "Dispute visibilidade em um ranking público de produtos brasileiros, ordenado por lances confirmados e sem números inventados.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeArena />;
}
