# ViraTopo

MVP de um ranking competitivo para produtos digitais brasileiros. Um produto sobe ao fazer o maior lance confirmado no ciclo atual.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

O MVP abre com dados realistas e um checkout PIX demonstrativo, portanto pode ser apresentado sem chaves externas. O formulário pede login local para espelhar o fluxo de criação de conta; nenhum pagamento é cobrado.

## Preparar Supabase

1. Crie um projeto no Supabase.
2. Execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha as credenciais públicas.
4. Conecte a interface de pagamento ao provedor PIX escolhido antes de qualquer uso comercial.

O schema inclui autenticação por e-mail, produtos, lances, ciclos de ranking e políticas de acesso por proprietário.

## Deploy na Vercel

1. Envie este repositório para o GitHub.
2. Importe-o na Vercel.
3. Cadastre as duas variáveis `NEXT_PUBLIC_SUPABASE_*` do `.env.example`.
4. Publique.

## Regras de produto

- Cada ciclo dura 24 horas.
- Apenas lances PIX confirmados entram no ranking.
- Um valor maior assume a posição; em empate, ganha a confirmação mais antiga.
- Exibições e cliques são públicos para tornar o ranking auditável.
