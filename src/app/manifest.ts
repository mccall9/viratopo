import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "ViraTopo", short_name: "ViraTopo", description: "Ranking público e transparente para produtos brasileiros.", start_url: "/", display: "standalone", background_color: "#f7f9f7", theme_color: "#168548", lang: "pt-BR", icons: [{ src: "/viratopo-mark.svg", sizes: "any", type: "image/svg+xml" }] };
}
