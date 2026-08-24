# Design Brief: ViraTopo redesign

## Problem

Quem quer colocar um produto no ranking precisa entender a disputa e agir rápido, sem uma interface inconsistente ou números fictícios.

## Solution

Um quadro de disputa claro: o lance é o centro da tela, o ranking explica sua regra e os estados vazios indicam a próxima ação.

## Experience Principles

1. Uma fonte de verdade visual — um único stylesheet e tokens sem sobrescritas concorrentes.
2. Ação antes de decoração — URL, lance e posição têm prioridade sobre cards ornamentais.
3. Estado honesto — sem métricas ou participantes demonstrativos.

## Aesthetic Direction

- **Philosophy**: quadro público de disputa, leve e preciso.
- **Tone**: direto, calmo e competitivo.
- **Reference points**: interfaces de placar e formulários de pagamento claros.
- **Anti-references**: colagens editoriais, dashboards de cards repetidos e gradientes decorativos.

## Responsive Behavior

Mobile usa uma coluna, cabeçalho somente com marca e ações grandes. Nenhuma grade de desktop é reaproveitada no breakpoint móvel.

## Accessibility Requirements

Foco visível, contraste AA, labels de formulário, diálogo modal e movimento reduzido.

## Out of Scope

Integração de pagamento real, dados reais de analytics e autenticação de produção.
