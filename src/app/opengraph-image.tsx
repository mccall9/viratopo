import { ImageResponse } from "next/og";

export const alt = "ViraTopo — ranking transparente para produtos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#f7f9f7", color: "#142018", fontFamily: "Arial, sans-serif" }}><div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "32px", fontWeight: 700 }}><span style={{ width: "52px", height: "52px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "#168548", color: "white" }}>V</span>ViraTopo</div><div style={{ display: "flex", maxWidth: "920px", fontSize: "78px", lineHeight: 1.02, letterSpacing: "-4px" }}>Ranking público.<br />Critério transparente.</div><div style={{ display: "flex", borderTop: "2px solid #dce4de", paddingTop: "26px", justifyContent: "space-between", fontSize: "24px", color: "#5f6f64" }}><span>Sem votos ou números inventados.</span><span style={{ color: "#168548" }}>viratopo.vercel.app</span></div></div>, size);
}
