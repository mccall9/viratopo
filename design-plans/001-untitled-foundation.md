# Improvement: uma única fundação visual para o ViraTopo

## Overview

Substituir as camadas visuais concorrentes por uma fundação única, derivada dos tokens do Untitled UI e adaptada à identidade verde e branca do ViraTopo. O fluxo e a ordem das páginas permanecem; mudam hierarquia, componentes, tipografia e estados.

## What to preserve

- Ordem da experiência: Quadro, Ranking, Estatísticas, Regras, Privacidade e Painel.
- Verde e branco como assinatura.
- Ranking sem dados fictícios e fluxo PIX explicitamente demonstrativo.
- Conteúdo jurídico já existente.

## What to improve

### 1. Consolidar a fundação

**Files:** `src/styles/theme.css`, `src/styles/globals.css`, `src/app/viratopo.css`, `src/app/layout.tsx`

- Usar um único conjunto de tokens: canvas, superfície, texto, borda, verde de ação, raios, espaçamento, tipografia e movimento.
- Remover Mantine, gradientes, texturas decorativas, sombras pesadas e folhas antigas não carregadas.
- Usar Geist para interface, Instrument Serif apenas em títulos principais e Geist Mono para valores e estados.

### 2. Tornar o primeiro passo inequívoco

**Files:** `src/app/page.tsx`

- Separar status de temporada em uma faixa editorial com bordas superior e inferior no desktop.
- Manter a dobra mobile limpa, sem a faixa.
- Exibir um único formulário de URL com label persistente, erro contextual e CTA claro.
- Mostrar confirmação de pagamento junto ao fluxo que a causou, nunca como toast desconectado.

### 3. Padronizar todas as rotas

**Files:** `src/app/{ranking,analytics,painel,termos,privacidade}/page.tsx`, `src/app/not-found.tsx`, `src/components/arena-nav.tsx`

- Compartilhar navegação, rodapé, cabeçalhos, vazios, botões, tabelas e painéis.
- Manter um único destaque verde por tela.
- Substituir ícones de biblioteca por SVGs locais consistentes.

## Design system

- Canvas: `#f7f9f7`
- Surface: `#ffffff`
- Ink: `#142018`
- Muted: `#5f6f64`
- Border: `#dce4de`
- Accent: `#168548`
- Accent soft: `#e8f5ec`
- Body: Geist; display: Instrument Serif; data: Geist Mono
- Radius: 8 / 12 / 16px; sem pílulas em elementos estruturais
- Motion: 160–240ms, transform/opacity, sem movimento permanente

## Validation checklist

- [x] Sem overflow horizontal em 320, 390, 768 e 1440px.
- [x] Alvos interativos de pelo menos 44px.
- [x] Foco visível e labels associados.
- [x] Estados vazio, erro e confirmação claros.
- [x] Nenhum número ou produto fictício.
- [x] Lint, testes e build aprovados.
