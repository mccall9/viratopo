# Motion plan: feedback causal e navegação discreta

## Goal

Fazer mudanças de estado parecerem conectadas à ação do usuário sem transformar a interface em uma vitrine de efeitos.

## Findings

1. `src/app/viratopo.css` mantém `will-change: transform` permanentemente no painel mobile.
2. O aviso de pagamento aparece em um toast desconectado do botão que o originou.
3. O menu mobile e o modal usam movimentos diferentes e curvas não padronizadas.
4. A regra de movimento reduzido elimina toda transição, inclusive feedback funcional.

## Implementation

- Remover `will-change` permanente.
- Substituir o toast por um painel inline que entra com `opacity` e `translateY(4px)` por 180ms.
- Usar tokens `--duration-fast`, `--duration-base` e `--ease-standard` em menu, modal, botões e feedback.
- Em `prefers-reduced-motion`, remover deslocamentos e manter apenas mudança de opacidade curta.
- Não animar propriedades de layout, sombra ou cor em grandes superfícies.

## Validation

- [x] Nenhuma animação automática ou infinita.
- [x] Nenhum `will-change` permanente.
- [x] Feedback aparece junto ao estado alterado.
- [x] Navegação e modal funcionam com teclado.
- [x] Movimento reduzido continua comunicando estados.
